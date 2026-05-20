export type NotificationTypeWire =
  | "LISTING_SUBMITTED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "AUCTION_STARTED"
  | "OUTBID"
  | "AUCTION_WON"
  | "PAYMENT_DUE"
  | "SYSTEM";

export type NotificationAudienceWire = "USER" | "ADMIN" | "BROADCAST";

export type NotificationDto = {
  id: string;
  audience: NotificationAudienceWire;
  recipientId: string | null;
  type: NotificationTypeWire;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsResponseDto = {
  notifications: NotificationDto[];
};

export type NotificationKind = "bid" | "alert" | "wa" | "email";

export type Notification = {
  id: string;
  type: NotificationTypeWire;
  kind: NotificationKind;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  unread: boolean;
  createdAt: Date;
};
