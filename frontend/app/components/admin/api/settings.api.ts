import { apiClient } from "@/app/lib/api/client";

export type PlatformFeeDto = {
  category: "CAR" | "GADGET";
  sellerFeeBps: number;
  buyerFeeBps: number;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BiddingSettingDto = {
  bidRequirementPercent: number;
};

export type PaymentAccountDto = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
} | null;

export type EscrowSettingDto = {
  minHoldBps: number;
  maxHoldBps: number;
  paymentWindowHours: number;
  autoExtendMinutes: number;
};

export type PlatformTogglesDto = {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pauseNewListings: boolean;
};

export const listPlatformFees = async (): Promise<PlatformFeeDto[]> => {
  const dto = await apiClient<{ platformFees: PlatformFeeDto[] }>(
    "/admin/settings/platform-fees",
  );
  return dto.platformFees;
};

export const updatePlatformFee = (input: {
  category: "cars" | "gadgets";
  sellerFeePct: number;
  buyerFeePct: number;
}) =>
  apiClient<unknown>("/admin/settings/platform-fees", {
    method: "PATCH",
    body: {
      category: input.category === "cars" ? "CAR" : "GADGET",
      sellerFeeBps: Math.round(input.sellerFeePct * 100),
      buyerFeeBps: Math.round(input.buyerFeePct * 100),
    },
  });

export const getBiddingSetting = async (): Promise<BiddingSettingDto> => {
  const dto = await apiClient<{ biddingSetting: BiddingSettingDto }>(
    "/admin/settings/bidding",
  );
  return dto.biddingSetting;
};

export const updateBiddingSetting = (input: { bidRequirementPercent: number }) =>
  apiClient<unknown>("/admin/settings/bidding", {
    method: "PATCH",
    body: input,
  });

export const getPaymentAccount = async (): Promise<PaymentAccountDto> => {
  const dto = await apiClient<{ paymentAccount: PaymentAccountDto }>(
    "/admin/settings/payment-account",
  );
  return dto.paymentAccount;
};

export const updatePaymentAccount = (input: {
  bankName: string;
  accountNumber: string;
  accountName: string;
}) =>
  apiClient<unknown>("/admin/settings/payment-account", {
    method: "PATCH",
    body: input,
  });

export const getEscrowSetting = async (): Promise<EscrowSettingDto> => {
  const dto = await apiClient<{ escrowSetting: EscrowSettingDto }>(
    "/admin/settings/escrow",
  );
  return dto.escrowSetting;
};

export const updateEscrowSetting = (input: Partial<EscrowSettingDto>) =>
  apiClient<unknown>("/admin/settings/escrow", {
    method: "PATCH",
    body: input,
  });

export const getPlatformToggles = async (): Promise<PlatformTogglesDto> => {
  const dto = await apiClient<{ toggles: PlatformTogglesDto }>(
    "/admin/settings/toggles",
  );
  return dto.toggles;
};

export const updatePlatformToggles = (input: Partial<PlatformTogglesDto>) =>
  apiClient<unknown>("/admin/settings/toggles", {
    method: "PATCH",
    body: input,
  });
