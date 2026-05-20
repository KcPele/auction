import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type {
  ListApplicationsResponseDto,
  ListingAccessApplication,
  ListingAccessApplicationDto,
  ListUserBidsResponseDto,
  ListWatchlistResponseDto,
  ListWonResponseDto,
  NotificationPreferencesInput,
  Stats,
  StatsDto,
  UpdateProfileInput,
  UserBid,
  WatchlistItem,
  WonAuction,
} from "../types/users.types";

const cat = (c: "CAR" | "GADGET" | null): "cars" | "gadgets" | null =>
  c === "CAR" ? "cars" : c === "GADGET" ? "gadgets" : null;

export const updateProfile = (input: UpdateProfileInput) =>
  apiClient<unknown>("/users/me", { method: "PATCH", body: input });

export const updateNotificationPreferences = (
  input: NotificationPreferencesInput,
) =>
  apiClient<unknown>("/users/me/notification-preferences", {
    method: "PATCH",
    body: input,
  });

export const listMyBids = async (
  params: { limit?: number; offset?: number; status?: "ACTIVE" | "SCHEDULED" | "WON" } = {},
): Promise<{ items: UserBid[]; total: number }> => {
  const dto = await apiClient<ListUserBidsResponseDto>("/users/me/bids", {
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      status: params.status,
    },
  });
  return {
    total: dto.total,
    items: dto.items.map((b) => ({
      auctionId: b.auctionId,
      title: b.auctionTitle,
      category: b.category === "CAR" ? "cars" : "gadgets",
      bidAmount: koboToNaira(b.bidAmountKobo),
      currentHighBid: koboToNaira(b.currentHighBidKobo),
      status: b.status,
      endsAt: new Date(b.endsAt),
      photoUrl: b.photoUrl,
    })),
  };
};

export const listWonAuctions = async (): Promise<WonAuction[]> => {
  const dto = await apiClient<ListWonResponseDto>("/users/me/won-auctions");
  return dto.items.map((i) => ({
    auctionId: i.auctionId,
    title: i.title,
    category: i.category === "CAR" ? "cars" : "gadgets",
    wonAt: i.wonAt ? new Date(i.wonAt) : null,
    paidAt: i.paidAt ? new Date(i.paidAt) : null,
    deliveryStatus: i.deliveryStatus,
    trackingInfo: i.trackingInfo,
  }));
};

export const getStats = async (): Promise<Stats> => {
  const dto = await apiClient<StatsDto>("/users/me/stats");
  return {
    totalBids: dto.totalBids,
    auctionsWon: dto.auctionsWon,
    winRate: dto.winRate,
    totalSpent: koboToNaira(dto.totalSpentKobo),
  };
};

const toApplication = (
  dto: ListingAccessApplicationDto,
): ListingAccessApplication => ({
  id: dto.id,
  category: dto.category === "CAR" ? "cars" : "gadgets",
  reason: dto.reason,
  status: dto.status,
  reviewNote: dto.reviewNote,
  createdAt: new Date(dto.createdAt),
  reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : null,
});

export const listApplications = async (): Promise<ListingAccessApplication[]> => {
  const dto = await apiClient<ListApplicationsResponseDto>(
    "/users/me/listing-access-applications",
  );
  return dto.items.map(toApplication);
};

export const applyForListingAccess = (input: {
  category: "cars" | "gadgets";
  reason: string;
}) =>
  apiClient<{ application: ListingAccessApplicationDto }>(
    "/users/me/listing-access-applications",
    {
      method: "POST",
      body: {
        category: input.category === "cars" ? "CAR" : "GADGET",
        reason: input.reason,
      },
    },
  );

export const redeemAccessCode = (code: string) =>
  apiClient<unknown>("/users/me/access-codes/redeem", {
    method: "POST",
    body: { code },
  });

export const listWatchlist = async (): Promise<WatchlistItem[]> => {
  const dto = await apiClient<ListWatchlistResponseDto>("/users/me/watchlist");
  return dto.items.map((i) => ({
    id: i.id,
    auctionId: i.auctionId,
    title: i.auctionTitle,
    category: cat(i.category),
    status: i.status,
    startTime: i.startTime ? new Date(i.startTime) : null,
    endTime: i.endTime ? new Date(i.endTime) : null,
    photoUrl: i.photoUrl,
  }));
};

export const addToWatchlist = (auctionId: string) =>
  apiClient<unknown>("/users/me/watchlist", {
    method: "POST",
    body: { auctionId },
  });

export const removeFromWatchlist = (auctionId: string) =>
  apiClient<unknown>(`/users/me/watchlist/${auctionId}`, { method: "DELETE" });
