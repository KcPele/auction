import { apiClient } from "@/app/lib/api/client";
import { koboToNaira } from "@/app/lib/format/money";
import type { TickerBid } from "../types";

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
