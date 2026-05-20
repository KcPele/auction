"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  banUser,
  getAdminUserWallet,
  listAdminUsers,
  unbanUser,
} from "../api/users.api";
import type { AdminUserStatus } from "../types/users.types";
import { adminKeys } from "./admin-keys";

export function useAdminUsers(
  params: {
    search?: string;
    status?: AdminUserStatus;
    limit?: number;
    offset?: number;
  } = {},
) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => listAdminUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUserWallet(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.userWallet(id ?? ""),
    queryFn: () => getAdminUserWallet(id!),
    enabled: Boolean(id),
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: banUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unbanUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
