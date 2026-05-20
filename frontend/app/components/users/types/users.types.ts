// User-self endpoints (PATCH /users/me, watchlist, bids, won, etc.)

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  nin?: string;
};

export type NotificationPreferencesInput = {
  whatsappEnabled?: boolean;
  readyToBid?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
};

export type UserBidStatusUi = "leading" | "outbid" | "won";

export type UserBidItemDto = {
  auctionId: string;
  auctionTitle: string;
  category: "CAR" | "GADGET";
  bidAmountKobo: number;
  status: UserBidStatusUi;
  currentHighBidKobo: number;
  endsAt: string;
  photoUrl: string | null;
};

export type ListUserBidsResponseDto = {
  items: UserBidItemDto[];
  total: number;
};

export type UserBid = {
  auctionId: string;
  title: string;
  category: "cars" | "gadgets";
  bidAmount: number; // naira
  currentHighBid: number; // naira
  status: UserBidStatusUi;
  endsAt: Date;
  photoUrl: string | null;
};

export type WonAuctionItemDto = {
  auctionId: string;
  title: string;
  category: "CAR" | "GADGET";
  wonAt: string | null;
  paidAt: string | null;
  deliveryStatus: string;
  trackingInfo: Record<string, unknown> | null;
};

export type ListWonResponseDto = { items: WonAuctionItemDto[] };

export type WonAuction = {
  auctionId: string;
  title: string;
  category: "cars" | "gadgets";
  wonAt: Date | null;
  paidAt: Date | null;
  deliveryStatus: string;
  trackingInfo: Record<string, unknown> | null;
};

export type StatsDto = {
  totalBids: number;
  auctionsWon: number;
  winRate: number;
  totalSpentKobo: number;
};

export type Stats = {
  totalBids: number;
  auctionsWon: number;
  winRate: number;
  totalSpent: number; // naira
};

export type ListingAccessApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ListingAccessApplicationDto = {
  id: string;
  category: "CAR" | "GADGET";
  reason: string;
  status: ListingAccessApplicationStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type ListApplicationsResponseDto = {
  items: ListingAccessApplicationDto[];
};

export type ListingAccessApplication = {
  id: string;
  category: "cars" | "gadgets";
  reason: string;
  status: ListingAccessApplicationStatus;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

export type WatchlistItemDto = {
  id: string;
  auctionId: string;
  auctionTitle: string;
  category: "CAR" | "GADGET" | null;
  status: string | null;
  startTime: string | null;
  endTime: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type ListWatchlistResponseDto = { items: WatchlistItemDto[] };

export type WatchlistItem = {
  id: string;
  auctionId: string;
  title: string;
  category: "cars" | "gadgets" | null;
  status: string | null;
  startTime: Date | null;
  endTime: Date | null;
  photoUrl: string | null;
};
