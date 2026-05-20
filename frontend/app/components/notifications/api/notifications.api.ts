import { apiClient } from "@/app/lib/api/client";
import type {
  ListNotificationsResponseDto,
  Notification,
  NotificationDto,
  NotificationKind,
  NotificationTypeWire,
} from "../types/notification.types";

const KIND_OF: Record<NotificationTypeWire, NotificationKind> = {
  LISTING_SUBMITTED: "alert",
  LISTING_APPROVED: "alert",
  LISTING_REJECTED: "alert",
  AUCTION_STARTED: "bid",
  OUTBID: "bid",
  AUCTION_WON: "bid",
  PAYMENT_DUE: "alert",
  SYSTEM: "email",
};

export const toNotification = (dto: NotificationDto): Notification => ({
  id: dto.id,
  type: dto.type,
  kind: KIND_OF[dto.type] ?? "email",
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
} = {}): Promise<Notification[]> => {
  const dto = await apiClient<ListNotificationsResponseDto>("/notifications", {
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      unreadOnly: params.unreadOnly ?? false,
    },
  });
  return dto.notifications.map(toNotification);
};

export const markNotificationRead = (id: string) =>
  apiClient<unknown>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  apiClient<unknown>("/notifications/read-all", { method: "PATCH" });
