"use client";
import { useEffect, useReducer } from "react";

export function useCountdown(target: number) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const t = setInterval(force, 1000);
    return () => clearInterval(t);
  }, []);
  const delta = Math.max(0, target - Date.now());
  return {
    d: Math.floor(delta / 86_400_000),
    h: Math.floor((delta / 3_600_000) % 24),
    m: Math.floor((delta / 60_000) % 60),
    s: Math.floor((delta / 1000) % 60),
    done: delta === 0,
    delta,
  };
}
