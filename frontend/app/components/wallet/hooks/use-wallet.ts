"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createWithdrawal,
  getFundingAccount,
  getLedger,
  getWallet,
  initiateTopup,
  listMyWithdrawals,
  listSupportedBanks,
  resolveBankAccount,
  simulateTopup,
} from "../api/wallet.api";
import type { Wallet, WithdrawalStatus } from "../types/wallet.types";
import type { ActivityBucket } from "../utils/ledger-display";
import { walletKeys } from "./wallet-keys";

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: getWallet,
  });
}

export function useLedger(
  params: {
    limit?: number;
    offset?: number;
    activity?: ActivityBucket;
  } = {},
) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  return useQuery({
    queryKey: walletKeys.ledgerPage({
      limit,
      offset,
      activity: params.activity,
    }),
    queryFn: () => getLedger({ limit, offset, activity: params.activity }),
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
/**
 * Re-checks the wallet after the user says they have transferred.
 *
 * Strowallet has no API for reading transfers into a virtual account, so the
 * credit only arrives via their webhook. All we can honestly do is refetch and
 * report whether it has landed yet.
 */
export function useConfirmTransfer() {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const before = qc.getQueryData<Wallet>(walletKeys.me())?.balance ?? 0;
      const wallet = await qc.fetchQuery({
        queryKey: walletKeys.me(),
        queryFn: getWallet,
        staleTime: 0,
      });
      await qc.invalidateQueries({ queryKey: walletKeys.ledger() });
      return { credited: wallet.balance > before, received: wallet.balance - before };
    } finally {
      setChecking(false);
    }
  };

  return { check, checking };
}

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

export function useSupportedBanks() {
  return useQuery({
    queryKey: walletKeys.banks(),
    queryFn: listSupportedBanks,
    staleTime: 24 * 60 * 60 * 1_000,
  });
}

export function useResolveBankAccount() {
  return useMutation({ mutationFn: resolveBankAccount });
}
