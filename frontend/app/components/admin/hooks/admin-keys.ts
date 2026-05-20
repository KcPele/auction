// Centralised admin query keys. One factory per resource.

export const adminKeys = {
  all: ["admin"] as const,

  // Dashboard
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  stats: (range: string) =>
    [...adminKeys.dashboard(), "stats", range] as const,
  activity: (params: { limit?: number; offset?: number; type?: string }) =>
    [...adminKeys.dashboard(), "activity", params] as const,
  systemHealth: () => [...adminKeys.dashboard(), "health"] as const,
  ledger: (params: { limit?: number; offset?: number; type?: string }) =>
    [...adminKeys.dashboard(), "ledger", params] as const,
  auctions: (params: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => [...adminKeys.all, "auctions", params] as const,

  // Listings + applications
  pendingListings: () =>
    [...adminKeys.all, "listings", "pending"] as const,
  pendingApplications: () =>
    [...adminKeys.all, "listing-applications", "pending"] as const,

  // Users
  users: (params: {
    search?: string;
    limit?: number;
    offset?: number;
  }) => [...adminKeys.all, "users", params] as const,
  userWallet: (id: string) =>
    [...adminKeys.all, "users", id, "wallet"] as const,

  // Withdrawals
  pendingWithdrawals: () =>
    [...adminKeys.all, "wallet-withdrawals", "pending"] as const,
  allWithdrawals: (params: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => [...adminKeys.all, "wallet-withdrawals", params] as const,

  // Access codes
  accessCodes: (params: { limit?: number; offset?: number }) =>
    [...adminKeys.all, "access-codes", params] as const,

  // Settings
  settings: () => [...adminKeys.all, "settings"] as const,
  platformFees: () => [...adminKeys.settings(), "platform-fees"] as const,
  bidding: () => [...adminKeys.settings(), "bidding"] as const,
  paymentAccount: () => [...adminKeys.settings(), "payment-account"] as const,
  escrow: () => [...adminKeys.settings(), "escrow"] as const,
  toggles: () => [...adminKeys.settings(), "toggles"] as const,

  // Disputes + mechanics + notifications
  disputes: (params: { status?: string; limit?: number; offset?: number }) =>
    [...adminKeys.all, "disputes", params] as const,
  mechanics: (params: {
    search?: string;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }) => [...adminKeys.all, "mechanics", params] as const,
  notificationLogs: (params: { channel?: string; status?: string }) =>
    [...adminKeys.all, "notification-logs", params] as const,
  inAppNotifications: () =>
    [...adminKeys.all, "in-app-notifications"] as const,
};
