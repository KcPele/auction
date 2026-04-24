"use client";
import { useEffect, useState } from "react";

export function useResendTimer(initial = 45) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return {
    remaining,
    reset: () => setRemaining(initial),
    isBlocked: remaining > 0,
    label: `0:${String(remaining).padStart(2, "0")}`,
  };
}
