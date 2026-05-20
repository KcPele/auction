"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAuction,
  getActivityFeed,
  getDashboardStats,
  getSystemHealth,
  listAdminAuctions,
  listAdminLedger,
} from "../api/dashboard.api";
import { adminKeys } from "./admin-keys";

export function useDashboardStats(range: string) {
  return useQuery({
    queryKey: adminKeys.stats(range),
    queryFn: () => getDashboardStats(range),
    staleTime: 30_000,
  });
}

export function useActivityFeed(
  params: { limit?: number; offset?: number; type?: string } = {},
) {
  return useQuery({
    queryKey: adminKeys.activity(params),
    queryFn: () => getActivityFeed(params),
    refetchInterval: 15_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: getSystemHealth,
    refetchInterval: 60_000,
  });
}

export function useAdminLedger(
  params: { limit?: number; offset?: number; type?: string } = {},
) {
  return useQuery({
    queryKey: adminKeys.ledger(params),
    queryFn: () => listAdminLedger(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminAuctions(
  params: { status?: string; limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: adminKeys.auctions(params),
    queryFn: () => listAdminAuctions(params),
    placeholderData: (prev) => prev,
  });
}

export function useCancelAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelAuction,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
