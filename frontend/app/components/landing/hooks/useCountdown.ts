"use client";
import { useNow } from "@/app/lib/format/use-now";

export function useCountdown(target: number) {
  const now = useNow();
  const diff = now === null ? 0 : Math.max(0, target - now);
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}
