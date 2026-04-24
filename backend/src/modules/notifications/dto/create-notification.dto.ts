import type { NotificationAudience } from '../../../common/enums/notification-audience.enum';
import type { NotificationType } from '../../../common/enums/notification-type.enum';

export type CreateNotificationDto = {
  audience: NotificationAudience;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};
