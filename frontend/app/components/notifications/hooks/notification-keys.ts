import type { NotificationKind } from "../types/notification.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (
    params: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      kind?: NotificationKind;
    } = {},
  ) =>
    [...notificationKeys.lists(), params] as const,
};
