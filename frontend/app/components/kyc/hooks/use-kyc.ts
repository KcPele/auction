"use client";
import { useMutation } from "@tanstack/react-query";
import {
  createKycSubaccount,
  sendKycOtp,
  verifyKycBvn,
  verifyKycNin,
} from "../api/kyc.api";

export function useVerifyKycNin() {
  return useMutation({ mutationFn: verifyKycNin });
}

export function useVerifyKycBvn() {
  return useMutation({ mutationFn: verifyKycBvn });
}

export function useSendKycOtp() {
  return useMutation({ mutationFn: sendKycOtp });
}

export function useCreateKycSubaccount() {
  return useMutation({ mutationFn: createKycSubaccount });
}
