export type ListingStatusWire =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type ListingStatusUi = "draft" | "pending" | "approved" | "rejected";

export type ListingCategoryUi = "cars" | "gadgets";

export type CarListingDto = {
  id: string;
  listerId: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  registrationNumber: string;
  mileage: number;
  condition: string;
  knownFaults: string | null;
  mechanicId: string | null;
  photoUrls: string[];
  basePriceKobo: number | string;
  holdPercent: number;
  minimumBidIncrementKobo: number | string;
  startTime: string;
  durationMinutes: number;
  status: ListingStatusWire;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GadgetListingDto = {
  id: string;
  listerId: string;
  type: string;
  brand: string;
  model: string;
  colour: string;
  batteryHealthPercent: number | null;
  specs: Record<string, string> | null;
  usageHistory: string;
  defects: string | null;
  proofDocumentUrl: string;
  photoUrls: string[];
  videoUrls: string[];
  basePriceKobo: number | string;
  holdPercent: number;
  minimumBidIncrementKobo: number | string;
  startTime: string;
  durationMinutes: number;
  status: ListingStatusWire;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CarListingsResponseDto = { carListings: CarListingDto[] };
export type GadgetListingsResponseDto = { gadgetListings: GadgetListingDto[] };

export type CarListingResponseDto = { carListing: CarListingDto };
export type GadgetListingResponseDto = { gadgetListing: GadgetListingDto };

export type Listing = {
  id: string;
  category: ListingCategoryUi;
  title: string;
  status: ListingStatusUi;
  basePrice: number; // naira
  startTime: Date;
  durationMinutes: number;
  photoUrls: string[];
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CarListing = Listing & {
  category: "cars";
  make: string;
  model: string;
  year: number;
  colour: string;
  registrationNumber: string;
  mileage: number;
  condition: string;
  knownFaults: string | null;
  holdPercent: number;
  minimumBidIncrement: number;
};

export type GadgetListing = Listing & {
  category: "gadgets";
  type: string;
  brand: string;
  model: string;
  colour: string;
  batteryHealthPercent: number | null;
  specs: Record<string, string> | null;
  usageHistory: string;
  defects: string | null;
  proofDocumentUrl: string;
  videoUrls: string[];
  holdPercent: number;
  minimumBidIncrement: number;
};

export type AnyListing = CarListing | GadgetListing;

export type CreateCarInput = {
  make: string;
  model: string;
  year: number;
  colour: string;
  registrationNumber: string;
  mileage: number;
  condition: string;
  knownFaults?: string;
  mechanicId?: string;
  photoUrls: string[];
  basePriceNaira: number;
  holdPercent: number;
  minimumBidIncrementNaira: number;
  startTime: string; // ISO
  durationMinutes: number;
};

export type CreateGadgetInput = {
  type: string;
  brand: string;
  model: string;
  colour: string;
  batteryHealthPercent?: number;
  specs: Record<string, string>;
  usageHistory: string;
  defects?: string;
  proofDocumentUrl: string;
  photoUrls: string[];
  videoUrls?: string[];
  basePriceNaira: number;
  holdPercent: number;
  minimumBidIncrementNaira: number;
  startTime: string;
  durationMinutes: number;
};

export type UpdateCarInput = Partial<CreateCarInput>;
export type UpdateGadgetInput = Partial<CreateGadgetInput>;

export type UploadPurpose =
  | "LISTING_PHOTO"
  | "LISTING_VIDEO"
  | "PROOF_DOCUMENT"
  | "INSPECTION_MEDIA";

export type UploadAssetDto = {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  purpose: UploadPurpose;
  category: "CAR" | "GADGET" | null;
};

export type UploadOneResponseDto = { uploadAsset: UploadAssetDto };
export type UploadBatchResponseDto = { uploadAssets: UploadAssetDto[] };
