import { apiClient } from "@/app/lib/api/client";
import { koboToNaira, nairaToKobo } from "@/app/lib/format/money";
import type {
  AnyListing,
  CarListing,
  CarListingDto,
  CarListingResponseDto,
  CarListingsResponseDto,
  CreateCarInput,
  CreateGadgetInput,
  GadgetListing,
  GadgetListingDto,
  GadgetListingResponseDto,
  GadgetListingsResponseDto,
  ListingStatusUi,
  ListingStatusWire,
  UpdateCarInput,
  UpdateGadgetInput,
  UploadAssetDto,
  UploadBatchResponseDto,
  UploadOneResponseDto,
  UploadPurpose,
} from "../types/listing.types";

const STATUS_MAP: Record<ListingStatusWire, ListingStatusUi> = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const num = (v: number | string): number =>
  typeof v === "string" ? Number(v) : v;

export const toCarListing = (dto: CarListingDto): CarListing => ({
  id: dto.id,
  category: "cars",
  title: `${dto.year} ${dto.make} ${dto.model}`.trim(),
  status: STATUS_MAP[dto.status],
  basePrice: koboToNaira(num(dto.basePriceKobo)),
  startTime: new Date(dto.startTime),
  durationMinutes: dto.durationMinutes,
  photoUrls: dto.photoUrls ?? [],
  reviewNote: dto.reviewNote,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
  make: dto.make,
  model: dto.model,
  year: dto.year,
  colour: dto.colour,
  registrationNumber: dto.registrationNumber,
  mileage: dto.mileage,
  condition: dto.condition,
  knownFaults: dto.knownFaults,
  videoUrls: dto.videoUrls ?? [],
  holdPercent: dto.holdPercent,
  minimumBidIncrement: koboToNaira(num(dto.minimumBidIncrementKobo)),
});

export const toGadgetListing = (dto: GadgetListingDto): GadgetListing => ({
  id: dto.id,
  category: "gadgets",
  title: `${dto.brand} ${dto.model}`.trim(),
  status: STATUS_MAP[dto.status],
  basePrice: koboToNaira(num(dto.basePriceKobo)),
  startTime: new Date(dto.startTime),
  durationMinutes: dto.durationMinutes,
  photoUrls: dto.photoUrls ?? [],
  reviewNote: dto.reviewNote,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
  type: dto.type,
  brand: dto.brand,
  model: dto.model,
  colour: dto.colour,
  batteryHealthPercent: dto.batteryHealthPercent,
  specs: dto.specs,
  usageHistory: dto.usageHistory,
  defects: dto.defects,
  proofDocumentUrl: dto.proofDocumentUrl,
  videoUrls: dto.videoUrls ?? [],
  holdPercent: dto.holdPercent,
  minimumBidIncrement: koboToNaira(num(dto.minimumBidIncrementKobo)),
});

const carCreateBody = (input: CreateCarInput | UpdateCarInput) => ({
  ...input,
  ...(input.basePriceNaira !== undefined
    ? { basePriceKobo: nairaToKobo(input.basePriceNaira) }
    : {}),
  ...(input.minimumBidIncrementNaira !== undefined
    ? {
        minimumBidIncrementKobo: nairaToKobo(input.minimumBidIncrementNaira),
      }
    : {}),
  basePriceNaira: undefined,
  minimumBidIncrementNaira: undefined,
});

const gadgetCreateBody = (input: CreateGadgetInput | UpdateGadgetInput) => ({
  ...input,
  ...(input.basePriceNaira !== undefined
    ? { basePriceKobo: nairaToKobo(input.basePriceNaira) }
    : {}),
  ...(input.minimumBidIncrementNaira !== undefined
    ? {
        minimumBidIncrementKobo: nairaToKobo(input.minimumBidIncrementNaira),
      }
    : {}),
  basePriceNaira: undefined,
  minimumBidIncrementNaira: undefined,
});

export const listMyCars = async (): Promise<CarListing[]> => {
  const dto = await apiClient<CarListingsResponseDto>("/cars/my-listings");
  return dto.carListings.map(toCarListing);
};

export const listMyGadgets = async (): Promise<GadgetListing[]> => {
  const dto = await apiClient<GadgetListingsResponseDto>(
    "/gadgets/my-listings",
  );
  return dto.gadgetListings.map(toGadgetListing);
};

export const listMyListings = async (): Promise<AnyListing[]> => {
  const [cars, gadgets] = await Promise.all([listMyCars(), listMyGadgets()]);
  return [...cars, ...gadgets].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
};

export const getCarListing = async (id: string): Promise<CarListing> => {
  const dto = await apiClient<CarListingResponseDto>(`/cars/${id}`);
  return toCarListing(dto.carListing);
};

export const getGadgetListing = async (id: string): Promise<GadgetListing> => {
  const dto = await apiClient<GadgetListingResponseDto>(`/gadgets/${id}`);
  return toGadgetListing(dto.gadgetListing);
};

export const createCarListing = (input: CreateCarInput) =>
  apiClient<CarListingResponseDto>("/cars", {
    method: "POST",
    body: carCreateBody(input),
  });

export const createGadgetListing = (input: CreateGadgetInput) =>
  apiClient<GadgetListingResponseDto>("/gadgets", {
    method: "POST",
    body: gadgetCreateBody(input),
  });

export const updateCarListing = (id: string, input: UpdateCarInput) =>
  apiClient<CarListingResponseDto>(`/cars/${id}`, {
    method: "PATCH",
    body: carCreateBody(input),
  });

export const updateGadgetListing = (id: string, input: UpdateGadgetInput) =>
  apiClient<GadgetListingResponseDto>(`/gadgets/${id}`, {
    method: "PATCH",
    body: gadgetCreateBody(input),
  });

export const submitCarListing = (id: string) =>
  apiClient<CarListingResponseDto>(`/cars/${id}/submit`, { method: "POST" });

export const submitGadgetListing = (id: string) =>
  apiClient<GadgetListingResponseDto>(`/gadgets/${id}/submit`, {
    method: "POST",
  });

// Uploads
// Fastify multipart streams form parts in order — `file.fields` only contains
// text fields that arrived BEFORE the file part. Append purpose/category first
// so the backend can read them on every file in the iterator.
export const uploadOneFile = (input: {
  file: File;
  purpose: UploadPurpose;
  category?: "CAR" | "GADGET";
}): Promise<UploadAssetDto> => {
  const fd = new FormData();
  fd.append("purpose", input.purpose);
  if (input.category) fd.append("category", input.category);
  fd.append("file", input.file);
  return apiClient<UploadOneResponseDto>("/uploads", {
    method: "POST",
    body: fd,
  }).then((r) => r.uploadAsset);
};

export const uploadBatchFiles = (input: {
  files: File[];
  purpose: UploadPurpose;
  category?: "CAR" | "GADGET";
}): Promise<UploadAssetDto[]> => {
  const fd = new FormData();
  fd.append("purpose", input.purpose);
  if (input.category) fd.append("category", input.category);
  for (const f of input.files) fd.append("files", f);
  return apiClient<UploadBatchResponseDto>("/uploads/batch", {
    method: "POST",
    body: fd,
  }).then((r) => r.uploadAssets);
};
