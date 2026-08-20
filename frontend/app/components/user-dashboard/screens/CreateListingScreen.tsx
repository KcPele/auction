"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategoryStep } from "../create-listing/CategoryStep";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_TOTAL_BYTES,
} from "../create-listing/constants";
import {
  CarDetailsStep,
  GadgetDetailsStep,
} from "../create-listing/DetailsSteps";
import { PreviewStep } from "../create-listing/PreviewStep";
import { PricingStep } from "../create-listing/PricingStep";
import type {
  ListingCategory,
  ListingMediaProps,
  ListingVideo,
  Step,
} from "../create-listing/types";
import { parseSpecs } from "../create-listing/utils";
import {
  validateCarDetails,
  validateGadgetDetails,
  validatePricing,
} from "../create-listing/form-validation";
import {
  useCreateCar,
  useCreateGadget,
  useUploadBatch,
  useUploadOne,
  useVerifiedMechanics,
} from "@/app/components/listings/hooks/use-listings";
import { ApiError } from "@/app/lib/api/error";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { useAbility } from "@/app/lib/permissions/provider";
import { subject } from "@casl/ability";

const STEPS: Step[] = ["category", "details", "pricing", "preview"];

export function CreateListingScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const ability = useAbility();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<ListingCategory | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [colour, setColour] = useState("");
  const [registration, setRegistration] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [faults, setFaults] = useState("");
  const [mechanicId, setMechanicId] = useState("");

  const [gadgetType, setGadgetType] = useState("");
  const [brand, setBrand] = useState("");
  const [gadgetModel, setGadgetModel] = useState("");
  const [gadgetColour, setGadgetColour] = useState("");
  const [battery, setBattery] = useState("");
  const [specs, setSpecs] = useState("");
  const [usage, setUsage] = useState("");
  const [defects, setDefects] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const [basePrice, setBasePrice] = useState(0);
  const [holdPercent, setHoldPercent] = useState(10);
  const [bidIncrement, setBidIncrement] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(120);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<ListingVideo[]>([]);

  const uploadBatch = useUploadBatch();
  const uploadOne = useUploadOne();
  const createCar = useCreateCar();
  const createGadget = useCreateGadget();
  const mechanics = useVerifiedMechanics();

  const onPhotos = async (files: FileList | null) => {
    if (!files || !files.length || !category) return;
    const remaining = MAX_LISTING_PHOTOS - photoUrls.length;
    if (remaining <= 0) {
      toast.error(`A listing can have up to ${MAX_LISTING_PHOTOS} photos`);
      return;
    }

    try {
      const assets = await uploadBatch.mutateAsync({
        files: Array.from(files).slice(0, remaining),
        purpose: "LISTING_PHOTO",
        category,
      });
      setPhotoUrls((current) => [...current, ...assets.map((asset) => asset.url)]);
      toast.success(`Uploaded ${assets.length} photo(s)`);
    } catch (error) {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Could not upload photos");
    }
  };

  const onVideos = async (files: FileList | null) => {
    if (!files || !files.length || !category) return;
    const remainingSlots = MAX_LISTING_VIDEOS - videos.length;
    if (remainingSlots <= 0) {
      toast.error(`A listing can have up to ${MAX_LISTING_VIDEOS} videos`);
      return;
    }

    const picked = Array.from(files).slice(0, remainingSlots);
    const usedBytes = videos.reduce((total, video) => total + video.sizeBytes, 0);
    const addedBytes = picked.reduce((total, file) => total + file.size, 0);
    if (usedBytes + addedBytes > MAX_VIDEO_TOTAL_BYTES) {
      toast.error(
        `Total video size must stay under ${MAX_VIDEO_TOTAL_BYTES / (1024 * 1024)} MB`,
      );
      return;
    }

    try {
      const assets = await uploadBatch.mutateAsync({
        files: picked,
        purpose: "LISTING_VIDEO",
        category,
      });
      setVideos((current) => [
        ...current,
        ...assets.map((asset, index) => ({
          url: asset.url,
          sizeBytes: picked[index].size,
        })),
      ]);
      toast.success(`Uploaded ${assets.length} video(s)`);
    } catch (error) {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Could not upload videos");
    }
  };

  const onProof = async (file: File) => {
    try {
      const asset = await uploadOne.mutateAsync({
        file,
        purpose: "PROOF_DOCUMENT",
        category: "GADGET",
      });
      setProofUrl(asset.url);
      toast.success("Proof uploaded");
    } catch (error) {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Could not upload proof");
    }
  };

  const onCreate = async () => {
    if (!category) return;
    if (photoUrls.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    if (!startTime) {
      toast.error("Pick a start time");
      return;
    }

    try {
      if (category === "CAR") {
        await createCar.mutateAsync({
          make,
          model,
          year: Number(year),
          colour,
          registrationNumber: registration,
          mileage: Number(mileage),
          condition,
          knownFaults: faults || undefined,
          mechanicId,
          photoUrls,
          videoUrls: videos.map((video) => video.url),
          basePriceNaira: basePrice,
          holdPercent,
          minimumBidIncrementNaira: bidIncrement,
          startTime: new Date(startTime).toISOString(),
          durationMinutes: duration,
        });
      } else {
        if (!proofUrl) {
          toast.error("Upload a proof document");
          return;
        }
        await createGadget.mutateAsync({
          type: gadgetType,
          brand,
          model: gadgetModel,
          colour: gadgetColour,
          batteryHealthPercent: battery ? Number(battery) : undefined,
          specs: parseSpecs(specs),
          usageHistory: usage,
          defects: defects || undefined,
          proofDocumentUrl: proofUrl,
          photoUrls,
          videoUrls: videos.map((video) => video.url),
          basePriceNaira: basePrice,
          holdPercent,
          minimumBidIncrementNaira: bidIncrement,
          startTime: new Date(startTime).toISOString(),
          durationMinutes: duration,
        });
      }
      toast.success("Draft created");
      router.push("/dashboard/listings");
    } catch (error) {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Could not create listing");
    }
  };

  const media: ListingMediaProps = {
    photoUrls,
    videos,
    onPhotos,
    onVideos,
    onRemovePhoto: (index) =>
      setPhotoUrls((current) => current.filter((_, itemIndex) => itemIndex !== index)),
    onRemoveVideo: (index) =>
      setVideos((current) => current.filter((_, itemIndex) => itemIndex !== index)),
    isPending: uploadBatch.isPending,
  };
  const isCreating = createCar.isPending || createGadget.isPending;
  const allowedCategories =
    me?.listingPermissions
      .map((permission) => permission.category)
      .filter((permittedCategory) =>
        ability.can("create", subject("Listing", { category: permittedCategory })),
      ) ?? [];

  const goToPricing = () => {
    const error =
      category === "CAR"
        ? validateCarDetails(
            {
              make,
              model,
              year,
              colour,
              registration,
              mileage,
              condition,
              faults,
              mechanicId,
            },
            photoUrls.length,
          )
        : validateGadgetDetails(
            {
              type: gadgetType,
              brand,
              model: gadgetModel,
              colour: gadgetColour,
              battery,
              specs,
              usage,
              defects,
            },
            proofUrl,
            photoUrls.length,
          );
    if (error) return toast.error(error);
    setStep("pricing");
  };

  const goToPreview = () => {
    const error = validatePricing({
      basePrice,
      holdPercent,
      bidIncrement,
      startTime,
      duration,
    });
    if (error) return toast.error(error);
    setStep("preview");
  };

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Create listing
      </h1>

      <div className="mt-3 flex gap-2">
        {STEPS.map((item, index) => (
          <div
            key={item}
            className={`h-1 flex-1 rounded-full ${
              item === step
                ? "bg-accent"
                : index < STEPS.indexOf(step)
                  ? "bg-accent/40"
                  : "bg-surface-2"
            }`}
          />
        ))}
      </div>

      {step === "category" && (
        <CategoryStep
          category={category}
          allowedCategories={allowedCategories}
          onSelect={setCategory}
          onContinue={() => setStep("details")}
        />
      )}

      {step === "details" && category === "CAR" && (
        <CarDetailsStep
          values={{
            make,
            model,
            year,
            colour,
            registration,
            mileage,
            condition,
            faults,
            mechanicId,
          }}
          onChange={{
            make: setMake,
            model: setModel,
            year: setYear,
            colour: setColour,
            registration: setRegistration,
            mileage: setMileage,
            condition: setCondition,
            faults: setFaults,
            mechanicId: setMechanicId,
          }}
          mechanics={mechanics.data ?? []}
          mechanicsLoading={mechanics.isLoading}
          mechanicsError={mechanics.isError}
          media={media}
          onBack={() => setStep("category")}
          onNext={goToPricing}
        />
      )}

      {step === "details" && category === "GADGET" && (
        <GadgetDetailsStep
          values={{
            type: gadgetType,
            brand,
            model: gadgetModel,
            colour: gadgetColour,
            battery,
            specs,
            usage,
            defects,
          }}
          onChange={{
            type: setGadgetType,
            brand: setBrand,
            model: setGadgetModel,
            colour: setGadgetColour,
            battery: setBattery,
            specs: setSpecs,
            usage: setUsage,
            defects: setDefects,
          }}
          proofUrl={proofUrl}
          onProof={onProof}
          media={media}
          onBack={() => setStep("category")}
          onNext={goToPricing}
        />
      )}

      {step === "pricing" && (
        <PricingStep
          basePrice={basePrice}
          holdPercent={holdPercent}
          bidIncrement={bidIncrement}
          startTime={startTime}
          duration={duration}
          onBasePriceChange={setBasePrice}
          onHoldPercentChange={setHoldPercent}
          onBidIncrementChange={setBidIncrement}
          onStartTimeChange={setStartTime}
          onDurationChange={setDuration}
          onBack={() => setStep("details")}
          onNext={goToPreview}
        />
      )}

      {step === "preview" && (
        <PreviewStep
          title={
            category === "CAR"
              ? `${year} ${make} ${model}`
              : `${brand} ${gadgetModel}`
          }
          summary={
            category === "CAR"
              ? `${colour} · ${mileage} km`
              : `${gadgetColour}${battery ? ` · ${battery}% battery` : ""}`
          }
          basePrice={basePrice}
          holdPercent={holdPercent}
          bidIncrement={bidIncrement}
          duration={duration}
          photoCount={photoUrls.length}
          isCreating={isCreating}
          onBack={() => setStep("pricing")}
          onCreate={onCreate}
        />
      )}
    </>
  );
}
