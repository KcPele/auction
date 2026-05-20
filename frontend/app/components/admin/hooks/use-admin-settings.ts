"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBiddingSetting,
  getEscrowSetting,
  getPaymentAccount,
  getPlatformToggles,
  listPlatformFees,
  updateBiddingSetting,
  updateEscrowSetting,
  updatePaymentAccount,
  updatePlatformFee,
  updatePlatformToggles,
} from "../api/settings.api";
import { adminKeys } from "./admin-keys";

export function usePlatformFees() {
  return useQuery({
    queryKey: adminKeys.platformFees(),
    queryFn: listPlatformFees,
  });
}

export function useUpdatePlatformFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformFee,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.platformFees() }),
  });
}

export function useBiddingSetting() {
  return useQuery({
    queryKey: adminKeys.bidding(),
    queryFn: getBiddingSetting,
  });
}

export function useUpdateBiddingSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBiddingSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.bidding() }),
  });
}

export function usePaymentAccount() {
  return useQuery({
    queryKey: adminKeys.paymentAccount(),
    queryFn: getPaymentAccount,
  });
}

export function useUpdatePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentAccount,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.paymentAccount() }),
  });
}

export function useEscrowSetting() {
  return useQuery({ queryKey: adminKeys.escrow(), queryFn: getEscrowSetting });
}

export function useUpdateEscrowSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEscrowSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.escrow() }),
  });
}

export function usePlatformToggles() {
  return useQuery({ queryKey: adminKeys.toggles(), queryFn: getPlatformToggles });
}

export function useUpdatePlatformToggles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformToggles,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.toggles() }),
  });
}
