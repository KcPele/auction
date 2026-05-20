"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.api";
import type { Notification } from "../types/notification.types";
import { notificationKeys } from "./notification-keys";

export function useNotifications(params: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
} = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.list({ unreadOnly: true, limit: 100 }),
    queryFn: () => listNotifications({ unreadOnly: true, limit: 100 }),
    select: (rows: Notification[]) => rows.length,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      // Patch every cached list optimistically.
      const snapshots = qc.getQueriesData<Notification[]>({
        queryKey: notificationKeys.all,
      });
      for (const [key, list] of snapshots) {
        if (!list) continue;
        qc.setQueryData<Notification[]>(
          key,
          list.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        );
      }
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) qc.setQueryData(key, prev);
      });
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const snapshots = qc.getQueriesData<Notification[]>({
        queryKey: notificationKeys.all,
      });
      for (const [key, list] of snapshots) {
        if (!list) continue;
        qc.setQueryData<Notification[]>(
          key,
          list.map((n) => ({ ...n, unread: false })),
        );
      }
      return { snapshots };
    },
    onError: (_err, _v, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        if (prev) qc.setQueryData(key, prev);
      });
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
