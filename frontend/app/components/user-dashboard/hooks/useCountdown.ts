"use client";
import { useNow } from "@/app/lib/format/use-now";

export function useCountdown(target: number) {
  const now = useNow();
  const delta = now === null ? null : Math.max(0, target - now);
  const safeDelta = delta ?? 0;
  return {
    d: Math.floor(safeDelta / 86_400_000),
    h: Math.floor((safeDelta / 3_600_000) % 24),
    m: Math.floor((safeDelta / 60_000) % 60),
    s: Math.floor((safeDelta / 1000) % 60),
    done: delta === 0,
    delta,
  };
}
