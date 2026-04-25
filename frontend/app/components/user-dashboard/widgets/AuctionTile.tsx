"use client";
import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { Countdown } from "./Countdown";
import { fmtNaira } from "../utils";
import type { Auction } from "../types";

const TILE_MEDIA_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 10px, rgba(255,170,90,0.07) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
};

export function AuctionTile({ a }: { a: Auction }) {
  return (
    <Link
      href={`/dashboard/auction/${a.id}`}
      className="block w-[230px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[14px] border border-line bg-surface text-left text-fg"
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center text-[rgba(255,200,140,0.3)]"
        style={TILE_MEDIA_BG}
      >
        <Icon name={a.cat === "cars" ? "car" : "phone"} size={46} />
        <span
          className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[5px] border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
            a.live
              ? "border-red/30 bg-red/15 text-red"
              : "border-accent/30 bg-accent/15 text-accent"
          }`}
        >
          {a.live ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" /> Live
            </>
          ) : (
            <>
              <Icon name="clock" size={10} /> Starts soon
            </>
          )}
        </span>
        <span className="absolute bottom-2.5 right-2.5 rounded-[5px] border border-line bg-black/70 px-2 py-1 font-mono text-[11px] tabular-nums backdrop-blur">
          <Countdown endsIn={a.endsIn} compact />
        </span>
      </div>
      <div className="p-3">
        <div className="mb-[3px] truncate text-[13px] font-semibold">{a.title}</div>
        <div className="mb-2 text-[11px] text-fg-dim">
          {a.bids} bids · {a.location}
        </div>
        <div className="text-[9px] uppercase tracking-[0.08em] text-fg-dim">
          {a.live ? "Current bid" : "Starts at"}
        </div>
        <div className="font-mono text-[15px] font-semibold tabular-nums text-accent-light">
          {fmtNaira(a.live ? a.current : a.start)}
        </div>
      </div>
    </Link>
  );
}
