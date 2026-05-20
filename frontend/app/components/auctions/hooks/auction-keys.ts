import type { AuctionCategory } from "../types/auction.types";

export const auctionKeys = {
  all: ["auctions"] as const,
  lists: () => [...auctionKeys.all, "list"] as const,
  list: (params: {
    category?: AuctionCategory;
    status?: "LIVE" | "SCHEDULED" | "ENDED";
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => [...auctionKeys.lists(), params] as const,
  detail: (id: string) => [...auctionKeys.all, "detail", id] as const,
  bids: (id: string) => [...auctionKeys.all, "bids", id] as const,
  paymentInstructions: (id: string) =>
    [...auctionKeys.all, "payment-instructions", id] as const,
  delivery: (id: string) => [...auctionKeys.all, "delivery", id] as const,
};
