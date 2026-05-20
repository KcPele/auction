import { apiClient } from "@/app/lib/api/client";
import { nairaToKobo } from "@/app/lib/format/money";

export const settleAuctionPayment = (input: {
  id: string;
  externalPaymentNaira?: number;
  walletPaymentNaira?: number;
  note?: string;
}) =>
  apiClient<unknown>(`/admin/auctions/${input.id}/settle-payment`, {
    method: "POST",
    body: {
      ...(input.externalPaymentNaira !== undefined
        ? { externalPaymentKobo: nairaToKobo(input.externalPaymentNaira) }
        : {}),
      ...(input.walletPaymentNaira !== undefined
        ? { walletPaymentKobo: nairaToKobo(input.walletPaymentNaira) }
        : {}),
      ...(input.note ? { note: input.note } : {}),
    },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });

export const defaultAuctionPayment = (input: { id: string; reason?: string }) =>
  apiClient<unknown>(`/admin/auctions/${input.id}/default-payment`, {
    method: "POST",
    body: input.reason ? { reason: input.reason } : {},
  });
