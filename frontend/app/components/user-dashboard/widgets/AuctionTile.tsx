"use client";
import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { Countdown } from "./Countdown";
import { fmtNaira } from "../utils";
import type { Auction } from "../types";

export function AuctionTile({ a }: { a: Auction }) {
  return (
    <Link href={`/dashboard/auction/${a.id}`} className="dash-tile">
      <div className="dash-tile-media">
        <Icon name={a.cat === "cars" ? "car" : "phone"} size={46} />
        <span className={`dash-tile-badge ${a.live ? "live" : "starting"}`}>
          {a.live ? (
            <>
              <span className="dash-live-dot" /> Live
            </>
          ) : (
            <>
              <Icon name="clock" size={10} /> Starts soon
            </>
          )}
        </span>
        <span className="dash-tile-end">
          <Countdown target={a.ends} compact />
        </span>
      </div>
      <div className="dash-tile-info">
        <div className="dash-tile-title">{a.title}</div>
        <div className="dash-tile-meta">
          {a.bids} bids · {a.location}
        </div>
        <div className="dash-tile-bid-lbl">
          {a.live ? "Current bid" : "Starts at"}
        </div>
        <div className="dash-tile-bid-val">
          {fmtNaira(a.live ? a.current : a.start)}
        </div>
      </div>
    </Link>
  );
}
