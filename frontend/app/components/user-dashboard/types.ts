export type Category = "cars" | "gadgets";

export interface Auction {
  id: string;
  title: string;
  cat: Category;
  meta: string;
  start: number;
  current: number;
  bids: number;
  /** Milliseconds from now until auction ends/opens. Resolve to absolute target on the client. */
  endsIn: number;
  live: boolean;
  location: string;
  seller: string;
  photos: number;
  highlights?: string[];
}

export type BidStatus = "leading" | "outbid" | "scheduled" | "won";

export interface MyBid {
  id: string;
  status: BidStatus;
  myBid: number | null;
  topBid: number | null;
}

export type ActivityType = "hold" | "release" | "top" | "pay";

export interface ActivityEntry {
  id: number;
  type: ActivityType;
  title: string;
  sub: string;
  amt: number;
  time: string;
}

export type NotifKind = "alert" | "bid" | "wa" | "email";

export interface Notif {
  id: number;
  kind: NotifKind;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

/** Matches backend DeliveryStatus enum */
export type DeliveryStatus =
  | "PAYMENT_CONFIRMED"
  | "SELLER_SHIPS"
  | "INSPECTION"
  | "DISPATCH"
  | "DELIVERED";

export interface DeliveryInfo {
  auctionId: string;
  auctionTitle: string;
  status: DeliveryStatus;
  trackingNumber?: string;
  carrier?: string;
  updatedAt: string;
  history: { status: DeliveryStatus; timestamp: string; note?: string }[];
}

/** Matches backend won-auction shape */
export interface WonAuction {
  id: string;
  auctionTitle: string;
  winningBid: number;
  status: "AWAITING_PAYMENT" | "PAYMENT_CONFIRMED" | "SETTLED" | "DEFAULTED";
  paymentDeadline?: string;
  deliveryStatus?: DeliveryStatus;
}

/** Matches backend ListingAccessApplication */
export interface ListingAccessApplication {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  category: Category;
  appliedAt: string;
  reviewedAt?: string;
  reason?: string;
}

/** Matches backend AccessCode */
export interface AccessCode {
  id: string;
  code: string;
  category: Category;
  active: boolean;
  expiresAt: string;
}

/** Matches backend UserStats */
export interface UserStats {
  bidsPlaced: number;
  auctionsWon: number;
  winRate: number;
  totalSpent: number;
}
