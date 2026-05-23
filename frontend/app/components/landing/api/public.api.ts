import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type { TickerBid } from "../types";

export type PublicStatsDto = {
  tradedVolumeKobo: number;
  verifiedBidders: number;
  settlementRate: number;
  settledIn24h: number;
};

export type PublicStats = {
  tradedVolume: number; // naira
  verifiedBidders: number;
  settlementRate: number;
};

export type FeaturedAuctionDto = {
  id: string;
  category: "CAR" | "GADGET";
  title: string;
  subtitle: string | null;
  basePriceKobo: number;
  currentBidKobo: number;
  bidders: number;
  holdPercent: number;
  startTime: string;
  endTime: string;
  status: string;
} | null;

export type FeaturedAuction = {
  id: string;
  category: "car" | "gadget";
  title: string;
  subtitle: string;
  basePrice: number;
  currentBid: number;
  bidders: number;
  holdPercent: number;
  startTime: Date;
  endTime: Date;
  status: string;
} | null;

export const getPublicStats = async (): Promise<PublicStats> => {
  const dto = await apiClient<PublicStatsDto>("/public/stats");
  return {
    tradedVolume: koboToNaira(dto.tradedVolumeKobo),
    verifiedBidders: dto.verifiedBidders,
    settlementRate: dto.settlementRate,
  };
};

export type CategoryStatsDto = {
  categories: Array<{
    key: "cars" | "gadgets";
    liveCount: number;
    settledCount: number;
    priceRange: { minKobo: number; maxKobo: number };
  }>;
};

export type CategoryStat = {
  key: "cars" | "gadgets";
  liveCount: number;
  settledCount: number;
  priceMin: number; // naira
  priceMax: number; // naira
};

export const getCategoryStats = async (): Promise<CategoryStat[]> => {
  const dto = await apiClient<CategoryStatsDto>("/public/category-stats");
  return dto.categories.map((c) => ({
    key: c.key,
    liveCount: c.liveCount,
    settledCount: c.settledCount,
    priceMin: koboToNaira(c.priceRange.minKobo),
    priceMax: koboToNaira(c.priceRange.maxKobo),
  }));
};

export const getFeaturedAuction = async (): Promise<FeaturedAuction> => {
  const dto = await apiClient<FeaturedAuctionDto>("/public/featured-auction");
  if (!dto) return null;
  return {
    id: dto.id,
    category: dto.category === "CAR" ? "car" : "gadget",
    title: dto.title,
    subtitle: dto.subtitle ?? "",
    basePrice: koboToNaira(dto.basePriceKobo),
    currentBid: koboToNaira(dto.currentBidKobo),
    bidders: dto.bidders,
    holdPercent: dto.holdPercent,
    startTime: new Date(dto.startTime),
    endTime: new Date(dto.endTime),
    status: dto.status,
  };
};

type RecentBidDto = {
  item: string;
  bidKobo: number;
  user: string;
  city: string | null;
  placedAt: string;
};

type RecentBidsResponseDto = { items: RecentBidDto[] };

export const listRecentBids = async (
  limit = 10,
): Promise<TickerBid[]> => {
  const dto = await apiClient<RecentBidsResponseDto>("/public/recent-bids", {
    query: { limit },
  });
  return dto.items.map((b) => ({
    item: b.item,
    bid: koboToNaira(b.bidKobo),
    user: b.user,
    city: b.city ?? "",
  }));
};
