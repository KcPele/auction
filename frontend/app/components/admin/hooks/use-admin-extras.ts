"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  investigateDispute,
  listInAppNotifications,
  listAdminDisputes,
  listAdminMechanics,
  listNotificationLogs,
  resolveDispute,
  revokeMechanic,
  verifyMechanic,
} from "../api/extras.api";
import { adminKeys } from "./admin-keys";

export function useAdminMechanics(
  params: { search?: string; status?: string } = {},
) {
  return useQuery({
    queryKey: adminKeys.mechanics(params),
    queryFn: () => listAdminMechanics(params),
  });
}

export function useVerifyMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyMechanic,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useRevokeMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeMechanic,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useAdminDisputes(params: { status?: string } = {}) {
  return useQuery({
    queryKey: adminKeys.disputes(params),
    queryFn: () => listAdminDisputes(params),
  });
}

export function useInvestigateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: investigateDispute,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveDispute,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useNotificationLogs(
  params: { channel?: string; status?: string } = {},
) {
  return useQuery({
    queryKey: adminKeys.notificationLogs(params),
    queryFn: () => listNotificationLogs(params),
    refetchInterval: 30_000,
  });
}

export function useInAppNotifications() {
  return useQuery({
    queryKey: adminKeys.inAppNotifications(),
    queryFn: listInAppNotifications,
    refetchInterval: 30_000,
  });
}
