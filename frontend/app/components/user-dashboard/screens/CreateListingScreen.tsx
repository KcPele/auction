"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateCar,
  useCreateGadget,
  useUploadBatch,
  useUploadOne,
} from "@/app/components/listings/hooks/use-listings";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type Step = "category" | "details" | "pricing" | "preview";
type ListingCategory = "CAR" | "GADGET";
const MAX_LISTING_PHOTOS = 10;

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

const inputClass =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim";
const labelClass = "mb-1 block text-xs font-medium text-fg-muted";

export function CreateListingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<ListingCategory | null>(null);

  // Car fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [colour, setColour] = useState("");
  const [reg, setReg] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [faults, setFaults] = useState("");

  // Gadget fields
  const [gadgetType, setGadgetType] = useState("");
  const [brand, setBrand] = useState("");
  const [gadgetModel, setGadgetModel] = useState("");
  const [gadgetColour, setGadgetColour] = useState("");
  const [battery, setBattery] = useState("");
  const [specs, setSpecs] = useState("");
  const [usage, setUsage] = useState("");
  const [defects, setDefects] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  // Pricing
  const [basePrice, setBasePrice] = useState(0);
  const [holdPercent, setHoldPercent] = useState(10);
  const [bidIncrement, setBidIncrement] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(120);

  // Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const photosInput = useRef<HTMLInputElement>(null);
  const proofInput = useRef<HTMLInputElement>(null);
  const uploadBatch = useUploadBatch();
  const uploadOne = useUploadOne();
  const createCar = useCreateCar();
  const createGadget = useCreateGadget();

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
      setPhotoUrls((p) => [...p, ...assets.map((a) => a.url)]);
      toast.success(`Uploaded ${assets.length} photo(s)`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not upload photos");
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
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
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
          registrationNumber: reg,
          mileage: Number(mileage),
          condition,
          knownFaults: faults || undefined,
          photoUrls,
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
          basePriceNaira: basePrice,
          holdPercent,
          minimumBidIncrementNaira: bidIncrement,
          startTime: new Date(startTime).toISOString(),
          durationMinutes: duration,
        });
      }
      toast.success("Draft created");
      router.push("/dashboard/listings");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not create listing");
    }
  };

  const isCreating = createCar.isPending || createGadget.isPending;

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Create listing
      </h1>

      <div className="mt-3 flex gap-2">
        {(["category", "details", "pricing", "preview"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s === step
                ? "bg-accent"
                : i <
                    ["category", "details", "pricing", "preview"].indexOf(step)
                  ? "bg-accent/40"
                  : "bg-surface-2"
            }`}
          />
        ))}
      </div>

      {step === "category" && (
        <div className="mt-6">
          <div className="mb-4 text-sm text-fg-muted">What are you listing?</div>
          <div className="grid grid-cols-2 gap-3">
            {(["CAR", "GADGET"] as ListingCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-3 rounded-[14px] border p-6 text-left transition-colors ${
                  category === cat
                    ? "border-accent bg-accent/[0.08]"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <Icon
                  name={cat === "CAR" ? "car" : "phone"}
                  size={32}
                  className={category === cat ? "text-accent" : "text-fg-muted"}
                />
                <div className="text-sm font-semibold">
                  {cat === "CAR" ? "Car" : "Gadget"}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!category}
            onClick={() => setStep("details")}
            className="mt-6 w-full cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00] disabled:opacity-40"
            style={PRIMARY_BTN_BG}
          >
            Continue
          </button>
        </div>
      )}

      {step === "details" && category === "CAR" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Car details</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make" v={make} on={setMake} placeholder="Toyota" />
            <Field label="Model" v={model} on={setModel} placeholder="Camry" />
            <Field label="Year" v={year} on={setYear} type="number" placeholder="2018" />
            <Field label="Colour" v={colour} on={setColour} placeholder="Black" />
            <Field label="Registration" v={reg} on={setReg} placeholder="ABC-123-LA" />
            <Field
              label="Mileage (km)"
              v={mileage}
              on={setMileage}
              type="number"
              placeholder="68000"
            />
          </div>
          <Field label="Condition" v={condition} on={setCondition} placeholder="Good" />
          <Field
            label="Known faults"
            v={faults}
            on={setFaults}
            placeholder="AC needs servicing"
          />
          <PhotoUploader
            photoUrls={photoUrls}
            onPick={() => photosInput.current?.click()}
            onRemove={(i) => setPhotoUrls((p) => p.filter((_, idx) => idx !== i))}
            isPending={uploadBatch.isPending}
          />
          <input
            ref={photosInput}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotos(e.target.files)}
          />
          <NavRow onBack={() => setStep("category")} onNext={() => setStep("pricing")} />
        </div>
      )}

      {step === "details" && category === "GADGET" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Gadget details</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" v={gadgetType} on={setGadgetType} placeholder="Phone" />
            <Field label="Brand" v={brand} on={setBrand} placeholder="Apple" />
            <Field label="Model" v={gadgetModel} on={setGadgetModel} placeholder="iPhone 14 Pro" />
            <Field label="Colour" v={gadgetColour} on={setGadgetColour} placeholder="Space Black" />
          </div>
          <Field
            label="Battery health %"
            v={battery}
            on={setBattery}
            type="number"
            placeholder="88"
          />
          <Field
            label="Specs (key:value, key:value)"
            v={specs}
            on={setSpecs}
            placeholder="ram:6GB, storage:256GB"
          />
          <Field label="Usage history" v={usage} on={setUsage} placeholder="Used for one year" />
          <Field label="Defects" v={defects} on={setDefects} placeholder="Small scratch on the side" />
          <div>
            <label className={labelClass}>Proof document</label>
            <button
              type="button"
              onClick={() => proofInput.current?.click()}
              className={`${inputClass} flex cursor-pointer items-center gap-2 text-fg-dim`}
            >
              <Icon name="shield" size={14} />
              {proofUrl ? "Replace receipt" : "Upload receipt"}
            </button>
            {proofUrl && (
              <div className="mt-1 truncate text-[10px] text-green">
                ✓ Uploaded
              </div>
            )}
            <input
              ref={proofInput}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onProof(f);
              }}
            />
          </div>
          <PhotoUploader
            photoUrls={photoUrls}
            onPick={() => photosInput.current?.click()}
            onRemove={(i) => setPhotoUrls((p) => p.filter((_, idx) => idx !== i))}
            isPending={uploadBatch.isPending}
          />
          <input
            ref={photosInput}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotos(e.target.files)}
          />
          <NavRow onBack={() => setStep("category")} onNext={() => setStep("pricing")} />
        </div>
      )}

      {step === "pricing" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Pricing & auction settings</div>
          <Field
            label="Base price (₦)"
            v={basePrice ? String(basePrice) : ""}
            on={(v) => setBasePrice(Number(v))}
            type="number"
            placeholder="2500000"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Hold % (10-20)"
              v={String(holdPercent)}
              on={(v) => setHoldPercent(Number(v))}
              type="number"
            />
            <Field
              label="Bid increment (₦)"
              v={bidIncrement ? String(bidIncrement) : ""}
              on={(v) => setBidIncrement(Number(v))}
              type="number"
              placeholder="50000"
            />
          </div>
          <div>
            <label className={labelClass}>Start time</label>
            <input
              className={inputClass}
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <Field
            label="Duration (minutes)"
            v={String(duration)}
            on={(v) => setDuration(Number(v))}
            type="number"
          />
          {basePrice > 0 && (
            <div className="rounded-lg border border-accent/20 bg-accent/[0.04] p-3 text-xs text-fg-muted">
              Hold per bid:{" "}
              <strong className="text-accent">
                {fmtNaira((basePrice * holdPercent) / 100)}
              </strong>
            </div>
          )}
          <NavRow onBack={() => setStep("details")} onNext={() => setStep("preview")} />
        </div>
      )}

      {step === "preview" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="text-sm text-fg-muted">Review & submit</div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <div className="text-[15px] font-semibold">
              {category === "CAR"
                ? `${year} ${make} ${model}`
                : `${brand} ${gadgetModel}`}
            </div>
            <div className="mt-1 text-xs text-fg-dim">
              {category === "CAR"
                ? `${colour} · ${mileage} km`
                : `${gadgetColour}${battery ? ` · ${battery}% battery` : ""}`}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Base price" value={fmtNaira(basePrice)} />
              <Stat label="Hold" value={`${holdPercent}%`} />
              <Stat label="Min increment" value={fmtNaira(bidIncrement)} />
              <Stat label="Duration" value={`${duration} min`} />
            </div>
            <div className="mt-2 text-[11px] text-fg-dim">
              Photos: {photoUrls.length}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3 text-xs text-fg-muted">
            Saved as draft. Submit it for admin review from My listings.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("pricing")}
              className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isCreating}
              onClick={onCreate}
              className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00] disabled:opacity-60"
              style={PRIMARY_BTN_BG}
            >
              {isCreating ? "Creating…" : "Create draft"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  v,
  on,
  type = "text",
  placeholder,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={inputClass}
        type={type}
        value={v}
        placeholder={placeholder}
        onChange={(e) => on(e.target.value)}
      />
    </div>
  );
}

function NavRow({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00]"
        style={PRIMARY_BTN_BG}
      >
        Continue
      </button>
    </div>
  );
}

function PhotoUploader({
  photoUrls,
  onPick,
  onRemove,
  isPending,
}: {
  photoUrls: string[];
  onPick: () => void;
  onRemove: (i: number) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        Photos ({photoUrls.length}/{MAX_LISTING_PHOTOS})
      </label>
      <button
        type="button"
        onClick={onPick}
        disabled={isPending || photoUrls.length >= MAX_LISTING_PHOTOS}
        className={`${inputClass} flex cursor-pointer items-center gap-2 text-fg-dim disabled:opacity-60`}
      >
        <Icon name="image" size={14} />
        {isPending
          ? "Uploading…"
          : photoUrls.length >= MAX_LISTING_PHOTOS
            ? "Maximum photos added"
            : "Add photos"}
      </button>
      {photoUrls.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photoUrls.map((u, i) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-fg"
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-2">
      <div className="text-fg-dim">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function parseSpecs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of s.split(",")) {
    const [k, v] = pair.split(":").map((x) => x.trim());
    if (k && v) out[k] = v;
  }
  return out;
}
