import type { IconName } from "@/app/components/user-dashboard/primitives/Icon";
import type { WalletLedgerType } from "../types/wallet.types";

// Group ledger types into the four UI buckets the wallet screen filters on.
export type ActivityBucket = "top" | "hold" | "release" | "pay";

export const BUCKET_FOR: Record<WalletLedgerType, ActivityBucket> = {
  WALLET_FUNDING_CONFIRMED: "top",
  ADMIN_ADJUSTMENT: "top",
  BID_HOLD_CREATED: "hold",
  BID_HOLD_APPLIED: "hold",
  BID_HOLD_RELEASED: "release",
  BID_HOLD_FORFEITED: "release",
  WITHDRAWAL_REQUESTED: "pay",
  WITHDRAWAL_CONFIRMED: "pay",
  WITHDRAWAL_FAILED: "release",
  FINAL_PAYMENT_CONFIRMED: "pay",
};

export const ICON_FOR: Record<ActivityBucket, IconName> = {
  top: "arrow-down",
  hold: "lock",
  release: "refresh",
  pay: "check",
};

export const ICON_BG: Record<ActivityBucket, string> = {
  top: "bg-green/[0.12] text-green",
  hold: "bg-accent/[0.12] text-accent",
  release: "bg-[rgba(107,176,255,0.12)] text-[var(--blue)]",
  pay: "bg-red/[0.12] text-red",
};
