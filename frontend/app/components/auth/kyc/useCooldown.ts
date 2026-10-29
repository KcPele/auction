"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Counts down from `seconds` once started. Used to space out OTP requests,
 * since each one sends a real SMS the provider charges for.
 */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, active: remaining > 0, start };
}
