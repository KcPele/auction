import { apiClient } from "@/app/lib/api/client";

export type KycStatus = {
  ninVerifiedAt: string | null;
  bvnVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  subaccountCreated: boolean;
};

export const getKycStatus = () => apiClient<KycStatus>("/kyc/status");

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

export type ConfirmBvnInput = {
  transactionId: string;
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
  apiClient<{
    verified: false;
    otpRequired: true;
    transactionId: string;
    message: string;
  }>("/kyc/bvn/verify", {
    method: "POST",
    body: input,
  });

export const confirmKycBvn = (input: ConfirmBvnInput) =>
  apiClient<{ verified: true; verifiedAt: string }>("/kyc/bvn/confirm", {
    method: "POST",
    body: input,
  });

export const createKycSubaccount = (input: CreateSubaccountInput) =>
  apiClient<{ created: boolean; subaccountId: string }>("/kyc/subaccount", {
    method: "POST",
    body: input,
  });
