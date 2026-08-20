"use client";
import { useQuery } from "@tanstack/react-query";
import {
  listAdminPendingWithdrawals,
  listAllAdminWithdrawals,
} from "../api/withdrawals.api";
import type { WithdrawalStatus } from "@/app/components/wallet/types/wallet.types";
import { adminKeys } from "./admin-keys";

export function usePendingWithdrawals(enabled = true) {
  return useQuery({
    queryKey: adminKeys.pendingWithdrawals(),
    queryFn: listAdminPendingWithdrawals,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useAllAdminWithdrawals(
  params: {
    status?: WithdrawalStatus;
    limit?: number;
    offset?: number;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: adminKeys.allWithdrawals(params),
    queryFn: () => listAllAdminWithdrawals(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}
