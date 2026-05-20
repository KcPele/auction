import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type {
  CarListingDto,
  GadgetListingDto,
} from "@/app/components/listings/types/listing.types";
import type {
  AccessCode,
  AccessCodeDto,
  AdminListingApplication,
  AdminListingApplicationDto,
  AdminPendingListing,
  CreateAccessCodeInput,
  ListAccessCodesResponseDto,
  ListPendingApplicationsResponseDto,
  ListPendingListingsResponseDto,
} from "../types/listings.types";

const num = (v: number | string): number =>
  typeof v === "string" ? Number(v) : v;

const toApp = (dto: AdminListingApplicationDto): AdminListingApplication => ({
  id: dto.id,
  userId: dto.userId,
  category: dto.category === "CAR" ? "cars" : "gadgets",
  reason: dto.reason,
  status: dto.status,
  reviewNote: dto.reviewNote,
  createdAt: new Date(dto.createdAt),
});

const carPending = (dto: CarListingDto): AdminPendingListing => ({
  id: dto.id,
  category: "cars",
  title: `${dto.year} ${dto.make} ${dto.model}`.trim(),
  basePrice: koboToNaira(num(dto.basePriceKobo)),
  holdPercent: dto.holdPercent,
  minimumBidIncrement: koboToNaira(num(dto.minimumBidIncrementKobo)),
  startTime: new Date(dto.startTime),
  durationMinutes: dto.durationMinutes,
  photoUrls: dto.photoUrls ?? [],
  listerId: dto.listerId,
  createdAt: new Date(dto.createdAt),
  raw: dto,
});

const gadgetPending = (dto: GadgetListingDto): AdminPendingListing => ({
  id: dto.id,
  category: "gadgets",
  title: `${dto.brand} ${dto.model}`.trim(),
  basePrice: koboToNaira(num(dto.basePriceKobo)),
  holdPercent: dto.holdPercent,
  minimumBidIncrement: koboToNaira(num(dto.minimumBidIncrementKobo)),
  startTime: new Date(dto.startTime),
  durationMinutes: dto.durationMinutes,
  photoUrls: dto.photoUrls ?? [],
  listerId: dto.listerId,
  createdAt: new Date(dto.createdAt),
  raw: dto,
});

export const listPendingApplications = async (): Promise<
  AdminListingApplication[]
> => {
  const dto = await apiClient<ListPendingApplicationsResponseDto>(
    "/admin/listing-access-applications/pending",
  );
  return dto.applications.map(toApp);
};

export const listPendingListings = async (): Promise<AdminPendingListing[]> => {
  const dto = await apiClient<ListPendingListingsResponseDto>(
    "/admin/listings/pending",
  );
  return [
    ...dto.carListings.map(carPending),
    ...dto.gadgetListings.map(gadgetPending),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const approveApplication = (input: {
  id: string;
  reviewNote?: string;
}) =>
  apiClient<unknown>(
    `/admin/listing-access-applications/${input.id}/approve`,
    {
      method: "POST",
      body: { reviewNote: input.reviewNote },
    },
  );

export const rejectApplication = (input: {
  id: string;
  reviewNote?: string;
}) =>
  apiClient<unknown>(
    `/admin/listing-access-applications/${input.id}/reject`,
    {
      method: "POST",
      body: { reviewNote: input.reviewNote },
    },
  );

export const approveListing = (input: {
  id: string;
  category: "cars" | "gadgets";
  reviewNote?: string;
}) =>
  apiClient<unknown>(
    `/admin/listings/${input.category === "cars" ? "CAR" : "GADGET"}/${input.id}/approve`,
    {
      method: "POST",
      body: { reviewNote: input.reviewNote },
    },
  );

export const rejectListing = (input: {
  id: string;
  category: "cars" | "gadgets";
  reviewNote?: string;
}) =>
  apiClient<unknown>(
    `/admin/listings/${input.category === "cars" ? "CAR" : "GADGET"}/${input.id}/reject`,
    {
      method: "POST",
      body: { reviewNote: input.reviewNote },
    },
  );

export const grantListingPermission = (input: {
  userId: string;
  category: "cars" | "gadgets";
}) =>
  apiClient<unknown>("/admin/listing-permissions", {
    method: "POST",
    body: {
      userId: input.userId,
      category: input.category === "cars" ? "CAR" : "GADGET",
    },
  });

const toAccessCode = (dto: AccessCodeDto): AccessCode => ({
  id: dto.id,
  code: dto.code,
  category: dto.category === "CAR" ? "cars" : "gadgets",
  expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
  isActive: dto.isActive,
  usedById: dto.usedById,
  usedAt: dto.usedAt ? new Date(dto.usedAt) : null,
  createdAt: new Date(dto.createdAt),
});

export const listAccessCodes = async (
  params: {
    category?: "cars" | "gadgets";
    active?: boolean;
  } = {},
): Promise<AccessCode[]> => {
  const dto = await apiClient<ListAccessCodesResponseDto>(
    "/admin/access-codes",
    {
      query: {
        category:
          params.category === "cars"
            ? "CAR"
            : params.category === "gadgets"
              ? "GADGET"
              : undefined,
        active:
          params.active === undefined
            ? undefined
            : params.active
              ? "true"
              : "false",
      },
    },
  );
  return dto.items.map(toAccessCode);
};

export const createAccessCode = (input: CreateAccessCodeInput) =>
  apiClient<{ accessCode: AccessCodeDto }>("/admin/access-codes", {
    method: "POST",
    body: {
      category: input.category === "cars" ? "CAR" : "GADGET",
      ...(input.code ? { code: input.code } : {}),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    },
  });
