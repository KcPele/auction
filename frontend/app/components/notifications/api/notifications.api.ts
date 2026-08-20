import { apiClient } from "@/app/lib/api/client";
import type {
  ListNotificationsResponseDto,
  Notification,
  NotificationDto,
  NotificationKind,
  NotificationPage,
  NotificationTypeWire,
} from "../types/notification.types";

const KIND_OF: Record<NotificationTypeWire, NotificationKind> = {
  LISTING_SUBMITTED: "listing",
  LISTING_APPROVED: "listing",
  LISTING_REJECTED: "listing",
  AUCTION_STARTED: "bid",
  OUTBID: "bid",
  AUCTION_WON: "bid",
  PAYMENT_DUE: "payment",
  SYSTEM: "system",
};

export const toNotification = (dto: NotificationDto): Notification => ({
  id: dto.id,
  type: dto.type,
  kind: KIND_OF[dto.type] ?? "system",
  title: dto.title,
  message: dto.message,
  data: dto.data,
  unread: dto.readAt === null,
  createdAt: new Date(dto.createdAt),
});

export const listNotifications = async (params: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  kind?: NotificationKind;
} = {}): Promise<NotificationPage> => {
  const dto = await apiClient<ListNotificationsResponseDto>("/notifications", {
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      unreadOnly: params.unreadOnly ?? false,
      kind: params.kind,
    },
  });
  return { items: dto.notifications.map(toNotification), total: dto.total };
};

export const markNotificationRead = (id: string) =>
  apiClient<unknown>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  apiClient<unknown>("/notifications/read-all", { method: "PATCH" });

export const getUnreadNotificationCount = async (): Promise<number> => {
  const dto = await apiClient<{ count: number }>(
    "/notifications/unread-count",
  );
  return dto.count;
};
