"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmWinnerPayment,
  getAuctionBids,
  getAuctionDetail,
  getDelivery,
  getPaymentInstructions,
  listAuctions,
  placeBid,
} from "../api/auction.api";
import type { AuctionCategory } from "../types/auction.types";
import { auctionKeys } from "./auction-keys";

export function useAuctions(params: {
  category?: AuctionCategory;
  status?: "LIVE" | "SCHEDULED" | "ENDED";
  search?: string;
  limit?: number;
  offset?: number;
  minPriceKobo?: number;
  maxPriceKobo?: number;
  minYear?: number;
  maxYear?: number;
} = {}) {
  return useQuery({
    queryKey: auctionKeys.list(params),
    queryFn: () => listAuctions(params),
  });
}

export function useAuction(id: string | undefined) {
  return useQuery({
    queryKey: auctionKeys.detail(id ?? ""),
    queryFn: () => getAuctionDetail(id!),
    enabled: Boolean(id),
  });
}

export function useAuctionBids(id: string | undefined) {
  return useQuery({
    queryKey: auctionKeys.bids(id ?? ""),
    queryFn: () => getAuctionBids(id!),
    enabled: Boolean(id),
  });
}

export function usePaymentInstructions(id: string | undefined) {
  return useQuery({
    queryKey: auctionKeys.paymentInstructions(id ?? ""),
    queryFn: () => getPaymentInstructions(id!),
    enabled: Boolean(id),
  });
}

export function usePlaceBid(auctionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amountNaira: number }) =>
      placeBid({ auctionId, amountNaira: input.amountNaira }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: auctionKeys.bids(auctionId) });
      qc.invalidateQueries({ queryKey: ["wallets", "me"] });
      qc.invalidateQueries({ queryKey: ["wallets", "ledger"] });
    },
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: auctionKeys.delivery(id ?? ""),
    queryFn: () => getDelivery(id!),
    enabled: Boolean(id),
  });
}

export function useConfirmWinnerPayment(auctionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => confirmWinnerPayment(auctionId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({
        queryKey: auctionKeys.paymentInstructions(auctionId),
      });
    },
  });
}
