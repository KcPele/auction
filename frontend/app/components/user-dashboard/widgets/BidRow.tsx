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

export function BidRow({ bid, auction }: BidRowProps) {
  if (!auction) return null;
  return (
    <Link href={`/dashboard/auction/${auction.id}`} className="dash-row">
      <div className="dash-row-thumb">
        <Icon name={auction.cat === "cars" ? "car" : "phone"} size={22} />
      </div>
      <div>
        <div className="dash-row-title">{auction.title}</div>
        <div className="dash-row-meta">
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
      <div style={{ textAlign: "right" }}>
        <div className={`dash-row-status ${bid.status}`}>{bid.status}</div>
        <div className="dash-row-amt">{bid.myBid ? fmtNaira(bid.myBid) : "—"}</div>
      </div>
    </Link>
  );
}
