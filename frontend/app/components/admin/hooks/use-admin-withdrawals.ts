"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authorizeWithdrawal,
  listAdminPendingWithdrawals,
  listAllAdminWithdrawals,
  resendWithdrawalOtp,
} from "../api/withdrawals.api";
import type { WithdrawalStatus } from "@/app/components/wallet/types/wallet.types";
import { adminKeys } from "./admin-keys";

export function usePendingWithdrawals() {
  return useQuery({
    queryKey: adminKeys.pendingWithdrawals(),
    queryFn: listAdminPendingWithdrawals,
    refetchInterval: 30_000,
  });
}

export function useAllAdminWithdrawals(
  params: {
    status?: WithdrawalStatus;
    limit?: number;
    offset?: number;
  } = {},
) {
  return useQuery({
    queryKey: adminKeys.allWithdrawals(params),
    queryFn: () => listAllAdminWithdrawals(params),
    placeholderData: (prev) => prev,
  });
}

export function useAuthorizeWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authorizeWithdrawal,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useResendWithdrawalOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resendWithdrawalOtp,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
