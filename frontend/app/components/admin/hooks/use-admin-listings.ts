"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  approveListing,
  createAccessCode,
  deactivateAccessCode,
  grantListingPermission,
  listAccessCodes,
  listPendingApplications,
  listPendingListings,
  rejectApplication,
  rejectListing,
} from "../api/listings.api";
import { adminKeys } from "./admin-keys";

export function usePendingApplications() {
  return useQuery({
    queryKey: adminKeys.pendingApplications(),
    queryFn: listPendingApplications,
  });
}

export function usePendingListings() {
  return useQuery({
    queryKey: adminKeys.pendingListings(),
    queryFn: listPendingListings,
  });
}

export function useApproveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveApplication,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.pendingApplications() }),
  });
}

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectApplication,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.pendingApplications() }),
  });
}

export function useApproveListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveListing,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.pendingListings() }),
  });
}

export function useRejectListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectListing,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminKeys.pendingListings() }),
  });
}

export function useGrantListingPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: grantListingPermission,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useAccessCodes(
  params: {
    category?: "cars" | "gadgets";
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {},
) {
  return useQuery({
    queryKey: adminKeys.accessCodes(params),
    queryFn: () => listAccessCodes(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateAccessCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccessCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useDeactivateAccessCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateAccessCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
