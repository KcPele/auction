import type { Notification } from '../entities/notification.entity';

export function presentNotification(
  notification: Notification,
  readAt?: Date | null,
) {
  return {
    id: notification.id,
    audience: notification.audience,
    recipientId: notification.recipientId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    readAt: readAt ?? null,
    createdAt: notification.createdAt,
  };
}
