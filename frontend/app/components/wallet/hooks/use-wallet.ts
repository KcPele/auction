"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWithdrawal,
  getFundingAccount,
  getLedger,
  getWallet,
  initiateTopup,
  listMyWithdrawals,
  simulateTopup,
} from "../api/wallet.api";
import type { WithdrawalStatus } from "../types/wallet.types";
import { walletKeys } from "./wallet-keys";

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: getWallet,
  });
}

export function useLedger(params: { limit?: number; offset?: number } = {}) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  return useQuery({
    queryKey: walletKeys.ledgerPage({ limit, offset }),
    queryFn: () => getLedger({ limit, offset }),
    placeholderData: (prev) => prev,
  });
}

export function useMyWithdrawals(
  params: { limit?: number; offset?: number; status?: WithdrawalStatus } = {},
) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  return useQuery({
    queryKey: walletKeys.withdrawalsList({ limit, offset, status: params.status }),
    queryFn: () => listMyWithdrawals({ limit, offset, status: params.status }),
    placeholderData: (prev) => prev,
  });
}

export function useFundingAccount() {
  // POST is invoked lazily via the mutation below (creates if missing).
  return useQuery({
    queryKey: walletKeys.fundingAccount(),
    queryFn: getFundingAccount,
  });
}

export function useInitiateTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initiateTopup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.fundingAccount() });
    },
  });
}

/**
 * Sandbox-only: instantly credit the wallet without a real bank transfer.
 * Backend gates this behind STROWALLET_MODE=sandbox.
 */
export function useSimulateTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: simulateTopup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.me() });
      qc.invalidateQueries({ queryKey: walletKeys.ledger() });
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.me() });
      qc.invalidateQueries({ queryKey: walletKeys.ledger() });
      qc.invalidateQueries({ queryKey: walletKeys.withdrawals() });
    },
  });
}
