"use client";
import { useEffect, useState } from "react";

export function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const delta = Math.max(0, target - now);
  return {
    d: Math.floor(delta / 86_400_000),
    h: Math.floor((delta / 3_600_000) % 24),
    m: Math.floor((delta / 60_000) % 60),
    s: Math.floor((delta / 1000) % 60),
    done: delta === 0,
    delta,
  };
}
