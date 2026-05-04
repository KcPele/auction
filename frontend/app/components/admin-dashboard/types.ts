export type Range = "1h" | "24h" | "7d" | "30d";

export interface KPI {
  value: number;
  spark: number[];
  delta?: number;
  count?: number;
}

export interface KPISet {
  gmv: KPI;
  settled: KPI;
  holds: KPI;
  success: KPI;
}

export type FeedType = "bid" | "win" | "pay" | "alert";
export interface FeedItem {
  id: string;
  type: FeedType;
  user: string;
  item: string;
  amt: number | null;
  time: string;
}

export type ListingKind = "car" | "gadget";
export interface Approval {
  id: string;
  kind: ListingKind;
  title: string;
  by: string;
  waited: string;
  photos: number;
  basePrice: number;
  tag?: string;
  mechanic?: string;
  proof?: string;
  year?: number;
  location?: string;
  mileage?: string;
  reg?: string;
  faults?: string;
  battery?: string;
  specs?: string;
  usage?: string;
}

export interface AdminAuction {
  id: string;
  title: string;
  bid: number;
  bidders: number;
  endSec: number;
  totalSec: number;
  elapsed: number;
  holdPct: number;
}

export interface LedgerEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  ref: string;
  amt: number;
  dir: "pos" | "neg";
}

export type HealthStatus = "ok" | "warn" | "err";
export interface HealthRow {
  name: string;
  val: string;
  status: HealthStatus;
  note: string;
}

export type SectionId =
  | "dashboard"
  | "auctions"
  | "access-codes"
  | "listings"
  | "disputes"
  | "users"
  | "mechanics"
  | "payments"
  | "withdrawals"
  | "settlements"
  | "notifications"
  | "health"
  | "settings";

export interface Counts {
  auctions: number;
  "access-codes": number;
  listings: number;
  disputes: number;
  withdrawals: number;
  settlements: number;
}
