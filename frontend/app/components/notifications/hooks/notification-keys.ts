export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) =>
    [...notificationKeys.all, "list", params] as const,
};
