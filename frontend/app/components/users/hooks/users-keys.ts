export const usersKeys = {
  all: ["users-self"] as const,
  bids: (params: { limit?: number; offset?: number; status?: string } = {}) =>
    [...usersKeys.all, "bids", params] as const,
  bidsAll: () => [...usersKeys.all, "bids"] as const,
  won: () => [...usersKeys.all, "won"] as const,
  stats: () => [...usersKeys.all, "stats"] as const,
  applications: () => [...usersKeys.all, "applications"] as const,
  watchlist: () => [...usersKeys.all, "watchlist"] as const,
};
