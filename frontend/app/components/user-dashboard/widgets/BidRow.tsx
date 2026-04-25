"use client";
import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { Countdown } from "./Countdown";
import { fmtNaira } from "../utils";
import type { Auction, MyBid } from "../types";

interface BidRowProps {
  bid: MyBid;
  auction: Auction | undefined;
}

const STATUS_COLOR: Record<MyBid["status"], string> = {
  leading: "text-green",
  outbid: "text-red",
  won: "text-accent",
  scheduled: "text-fg-muted",
};

const ROW_THUMB_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.07) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
};

export function BidRow({ bid, auction }: BidRowProps) {
  if (!auction) return null;
  return (
    <Link
      href={`/dashboard/auction/${auction.id}`}
      className="grid w-full cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-3 text-left text-fg last:border-b-0"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-[rgba(255,200,140,0.4)]"
        style={ROW_THUMB_BG}
      >
        <Icon name={auction.cat === "cars" ? "car" : "phone"} size={22} />
      </div>
      <div>
        <div className="text-[13px] font-medium">{auction.title}</div>
        <div className="text-[11px] text-fg-dim">
          {bid.status === "scheduled" ? (
            <>
              Opens in <Countdown endsIn={auction.endsIn} compact />
            </>
          ) : (
            <>
              Ends in <Countdown endsIn={auction.endsIn} compact /> · {auction.bids} bids
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_COLOR[bid.status]}`}
        >
          {bid.status}
        </div>
        <div className="font-mono text-[13px] font-semibold tabular-nums">
          {bid.myBid ? fmtNaira(bid.myBid) : "—"}
        </div>
      </div>
    </Link>
  );
}
