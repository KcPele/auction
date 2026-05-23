"use client";
import { useQuery } from "@tanstack/react-query";
import { listRecentBids } from "../api/public.api";
import type { TickerBid } from "../types";

/**
 * Pulls the latest bids from the public ticker endpoint, refreshing every 15s.
 * Returns an empty array when the API has nothing — the marquee is hidden in
 * that case so we never show fabricated data on the landing page.
 */
export function useTickerFeed(): TickerBid[] {
  const { data } = useQuery({
    queryKey: ["public", "recent-bids"],
    queryFn: () => listRecentBids(10),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  return data ?? [];
}
