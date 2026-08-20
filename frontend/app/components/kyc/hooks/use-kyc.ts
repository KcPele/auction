"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createKycSubaccount,
  confirmKycBvn,
  verifyKycBvn,
  verifyKycNin,
  getKycStatus,
} from "../api/kyc.api";

export function useKycStatus() {
  return useQuery({ queryKey: ["kyc", "status"], queryFn: getKycStatus });
}

export function useVerifyKycNin() {
  return useMutation({ mutationFn: verifyKycNin });
}

export function useVerifyKycBvn() {
  return useMutation({ mutationFn: verifyKycBvn });
}

export function useConfirmKycBvn() {
  return useMutation({ mutationFn: confirmKycBvn });
}

export function useCreateKycSubaccount() {
  return useMutation({ mutationFn: createKycSubaccount });
}
