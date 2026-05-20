export type DashboardStatsDto = {
  gmvKobo: number;
  auctionsSettled: number;
  walletHoldsKobo: number;
  activeBids: number;
  paymentSuccessRate: number;
};

export type DashboardStats = {
  gmv: number; // naira
  auctionsSettled: number;
  walletHolds: number; // naira
  activeBids: number;
  paymentSuccessRate: number;
};

export type ActivityFeedItemDto = {
  id: string;
  type: string;
  handle: string;
  label: string;
  amountKobo?: number;
  ts: string;
};

export type ActivityFeedResponseDto = { items: ActivityFeedItemDto[] };

export type ActivityFeedItem = {
  id: string;
  type: string;
  handle: string;
  label: string;
  amount: number | null; // naira
  ts: Date;
};

export type SystemServiceDto = {
  name: string;
  status: string;
  latency?: number;
};

export type SystemHealthResponseDto = { services: SystemServiceDto[] };

export type AdminLedgerDirection = "in" | "out";

export type AdminLedgerEntryDto = {
  id: string;
  ts: string;
  userId: string;
  handle: string;
  action: string;
  ref: string | null;
  amountKobo: number;
  direction: AdminLedgerDirection;
};

export type ListAdminLedgerResponseDto = {
  items: AdminLedgerEntryDto[];
  total: number;
};

export type AdminLedgerEntry = {
  id: string;
  ts: Date;
  handle: string;
  action: string;
  ref: string | null;
  amount: number; // naira
  direction: AdminLedgerDirection;
};

export type AdminAuctionItemDto = {
  id: string;
  title: string;
  category: "CAR" | "GADGET";
  status: string;
  currentBidKobo: number;
  bidderCount: number;
  holdPercent: number;
  endsAt: string;
  basePriceKobo: number;
};

export type ListAdminAuctionsResponseDto = {
  items: AdminAuctionItemDto[];
  total: number;
};

export type AdminAuctionItem = {
  id: string;
  title: string;
  category: "cars" | "gadgets";
  status: string;
  currentBid: number; // naira
  basePrice: number; // naira
  bidderCount: number;
  holdPercent: number;
  endsAt: Date;
};
