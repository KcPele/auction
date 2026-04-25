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
