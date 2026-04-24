export type AuctionStatus = "live" | "starting" | "scheduled";
export type PlaceholderKind = "photo" | "car" | "gadget";

export interface TickerBid {
  item: string;
  bid: number;
  user: string;
  city: string;
}

export interface Auction {
  title: string;
  meta: string;
  bid: number;
  bidders: number;
  status: AuctionStatus;
  end: number;
  kind: Exclude<PlaceholderKind, "photo">;
  tag: string;
}

export interface Step {
  title: string;
  desc: string;
  detail: string;
}

export type HowFlow = "bidder" | "lister";
