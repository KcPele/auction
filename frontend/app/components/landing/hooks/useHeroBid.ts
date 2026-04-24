"use client";
import { useEffect, useState } from "react";

export function useHeroBid(initial: number) {
  const [currentBid, setCurrentBid] = useState(initial);
  const [bidCount, setBidCount] = useState(47);
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.55) {
        setCurrentBid((b) => b + Math.round((Math.random() * 0.015 + 0.004) * b));
        setBidCount((c) => c + 1);
        setBumped(true);
        setTimeout(() => setBumped(false), 800);
      }
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return { currentBid, bidCount, bumped };
}
