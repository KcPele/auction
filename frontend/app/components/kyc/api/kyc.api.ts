import { apiClient } from "@/app/lib/api/client";

export type VerifyNinKycInput = {
  numberNin: string;
  surname: string;
  firstname: string;
  /** dd-mm-yyyy as backend expects */
  birthdate: string;
  telephoneno: string;
};

export type VerifyBvnInput = {
  number: string;
  firstName: string;
  lastName: string;
  /** dd-mm-yyyy */
  dateOfBirth: string;
  phoneNumber: string;
};

export type SendKycOtpInput = {
  phone: string;
  otp: string;
};

export type CreateSubaccountInput = {
  bvn: string;
  state: string;
  pin: string;
  address: string;
  country: string;
  business?: string;
  companyType?: string;
  cac?: string;
};

export const verifyKycNin = (input: VerifyNinKycInput) =>
  apiClient<{ verified: boolean; data?: unknown }>("/kyc/nin/verify", {
    method: "POST",
    body: input,
  });

export const verifyKycBvn = (input: VerifyBvnInput) =>
  apiClient<{ verified: boolean; data?: unknown }>("/kyc/bvn/verify", {
    method: "POST",
    body: input,
  });

export const sendKycOtp = (input: SendKycOtpInput) =>
  apiClient<{ status: boolean }>("/kyc/otp/send", {
    method: "POST",
    body: input,
  });

export const createKycSubaccount = (input: CreateSubaccountInput) =>
  apiClient<{ subaccount: Record<string, unknown> }>("/kyc/subaccount", {
    method: "POST",
    body: input,
  });
