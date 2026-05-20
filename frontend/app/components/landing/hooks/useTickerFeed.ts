"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRecentBids } from "../api/public.api";
import { TICKER_SEED } from "../data";
import type { TickerBid } from "../types";

/**
 * Pulls the latest bids from the public ticker endpoint, refreshing every 15s.
 * Between refetches, a local interval bumps a random row by a few percent so
 * the marquee feels alive when traffic is quiet. Falls back to TICKER_SEED
 * while the first fetch is in flight or if the API returns an empty list.
 */
export function useTickerFeed(): TickerBid[] {
  const { data } = useQuery({
    queryKey: ["public", "recent-bids"],
    queryFn: () => listRecentBids(10),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const [feed, setFeed] = useState<TickerBid[]>(TICKER_SEED);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const frame = window.requestAnimationFrame(() => setFeed(data));
    return () => window.cancelAnimationFrame(frame);
  }, [data]);

  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const bump = Math.round((Math.random() * 0.04 + 0.005) * next[idx].bid);
        next[idx] = { ...next[idx], bid: next[idx].bid + bump };
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return feed;
}
