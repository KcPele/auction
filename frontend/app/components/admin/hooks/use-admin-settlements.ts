"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  defaultAuctionPayment,
  settleAuctionPayment,
} from "../api/settlements.api";
import { adminKeys } from "./admin-keys";

export function useSettleAuctionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settleAuctionPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useDefaultAuctionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: defaultAuctionPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
