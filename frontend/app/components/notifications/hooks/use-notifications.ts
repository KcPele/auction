"use client";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsSocket } from "@/app/lib/realtime/socket";
import { useSession } from "@/app/lib/auth/client";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getUnreadNotificationCount,
  toNotification,
} from "../api/notifications.api";
import type {
  NotificationKind,
  NotificationPage,
  NotificationDto,
} from "../types/notification.types";
import { notificationKeys } from "./notification-keys";

export function useNotifications(params: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  kind?: NotificationKind;
} = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000,
  });
}

export function useNotificationsStream() {
  const qc = useQueryClient();
  const { data: authSession } = useSession();
  const sessionToken = authSession?.session.token;

  useEffect(() => {
    const socket = notificationsSocket(sessionToken);
    const onCreated = (payload: NotificationDto) => {
      const notification = toNotification(payload);
      qc.setQueryData<number>(notificationKeys.unreadCount(), (count = 0) =>
        notification.unread ? count + 1 : count,
      );
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
    };

    socket.on("notification.created", onCreated);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off("notification.created", onCreated);
    };
  }, [qc, sessionToken]);
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationKeys.lists() });
      // Patch every cached list optimistically.
      const snapshots = qc.getQueriesData<NotificationPage>({
        queryKey: notificationKeys.lists(),
      });
      for (const [key, list] of snapshots) {
        if (!list) continue;
        qc.setQueryData<NotificationPage>(
          key,
          {
            ...list,
            items: list.items.map((n) =>
              n.id === id ? { ...n, unread: false } : n,
            ),
          },
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
      await qc.cancelQueries({ queryKey: notificationKeys.lists() });
      const snapshots = qc.getQueriesData<NotificationPage>({
        queryKey: notificationKeys.lists(),
      });
      for (const [key, list] of snapshots) {
        if (!list) continue;
        qc.setQueryData<NotificationPage>(
          key,
          { ...list, items: list.items.map((n) => ({ ...n, unread: false })) },
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
