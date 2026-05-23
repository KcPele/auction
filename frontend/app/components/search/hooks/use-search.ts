"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAuctions } from "../api/search.api";

export function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useSearchAuctions(q: string) {
  const debounced = useDebounced(q.trim(), 200);
  return useQuery({
    queryKey: ["search", "auctions", debounced],
    queryFn: () => searchAuctions(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });
}
