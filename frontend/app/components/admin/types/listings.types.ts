import type {
  CarListingDto,
  GadgetListingDto,
} from "@/app/components/listings/types/listing.types";

export type AdminListingApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type AdminListingApplicationDto = {
  id: string;
  userId: string;
  category: "CAR" | "GADGET";
  reason: string;
  status: AdminListingApplicationStatus;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListPendingApplicationsResponseDto = {
  applications: AdminListingApplicationDto[];
};

export type AdminListingApplication = {
  id: string;
  userId: string;
  category: "cars" | "gadgets";
  reason: string;
  status: AdminListingApplicationStatus;
  reviewNote: string | null;
  createdAt: Date;
};

export type ListPendingListingsResponseDto = {
  carListings: CarListingDto[];
  gadgetListings: GadgetListingDto[];
};

export type AdminPendingListing = {
  id: string;
  category: "cars" | "gadgets";
  title: string;
  basePrice: number; // naira
  holdPercent: number;
  minimumBidIncrement: number; // naira
  startTime: Date;
  durationMinutes: number;
  photoUrls: string[];
  listerId: string;
  createdAt: Date;
  // Carry the raw DTO so the dialog can show every field without a second
  // request; admins inspect these listings end-to-end.
  raw: CarListingDto | GadgetListingDto;
};

export type AccessCodeDto = {
  id: string;
  code: string;
  category: "CAR" | "GADGET";
  expiresAt: string | null;
  isActive: boolean;
  usedById: string | null;
  usedAt: string | null;
  createdAt: string;
};

export type ListAccessCodesResponseDto = { items: AccessCodeDto[] };

export type AccessCode = {
  id: string;
  code: string;
  category: "cars" | "gadgets";
  expiresAt: Date | null;
  isActive: boolean;
  usedById: string | null;
  usedAt: Date | null;
  createdAt: Date;
};

export type CreateAccessCodeInput = {
  category: "cars" | "gadgets";
  code?: string;
  expiresAt?: string; // ISO
};
