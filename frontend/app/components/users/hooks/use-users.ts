"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/app/components/auth/hooks/auth-keys";
import {
  addToWatchlist,
  applyForListingAccess,
  getStats,
  listApplications,
  listMyBids,
  listWatchlist,
  listWonAuctions,
  redeemAccessCode,
  removeFromWatchlist,
  updateNotificationPreferences,
  updateProfile,
} from "../api/users.api";
import { usersKeys } from "./users-keys";

export function useMyBids(params: {
  limit?: number;
  offset?: number;
  status?: "ACTIVE" | "SCHEDULED" | "WON";
} = {}) {
  return useQuery({
    queryKey: usersKeys.bids(params),
    queryFn: () => listMyBids(params),
  });
}

export function useWonAuctions() {
  return useQuery({ queryKey: usersKeys.won(), queryFn: listWonAuctions });
}

export function useStats() {
  return useQuery({ queryKey: usersKeys.stats(), queryFn: getStats });
}

export function useApplications() {
  return useQuery({
    queryKey: usersKeys.applications(),
    queryFn: listApplications,
  });
}

export function useWatchlist() {
  return useQuery({ queryKey: usersKeys.watchlist(), queryFn: listWatchlist });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useApplyForListingAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyForListingAccess,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.applications() }),
  });
}

export function useRedeemAccessCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: redeemAccessCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
      qc.invalidateQueries({ queryKey: usersKeys.applications() });
    },
  });
}

export function useAddToWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.watchlist() }),
  });
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.watchlist() }),
  });
}
