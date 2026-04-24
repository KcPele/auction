"use client";
import { useEffect, useState } from "react";
import { TICKER_SEED } from "../data";
import type { TickerBid } from "../types";

export function useTickerFeed(): TickerBid[] {
  const [feed, setFeed] = useState<TickerBid[]>(TICKER_SEED);
  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
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
