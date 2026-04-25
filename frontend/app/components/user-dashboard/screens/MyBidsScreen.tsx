"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "../primitives/Icon";
import { BidRow } from "../widgets/BidRow";
import { AUCTIONS, MY_BIDS } from "../data";
import type { Auction, MyBid } from "../types";

type TabId = "active" | "scheduled" | "won";

const WON_BIDS: MyBid[] = [{ id: "a-4462", status: "won", myBid: 740_000, topBid: 740_000 }];

const FALLBACK_AUCTION: Auction = {
  id: "a-4462",
  title: 'iPad Pro 11"',
  cat: "gadgets",
  meta: "Won · 12 Apr",
  start: 740_000,
  current: 740_000,
  bids: 14,
  endsIn: 0,
  live: false,
  location: "Lekki",
  seller: "—",
  photos: 6,
};

function lookup(id: string): Auction {
  return AUCTIONS.find((a) => a.id === id) ?? FALLBACK_AUCTION;
}

const DELIVERY_STEPS = [
  { label: "Payment confirmed", done: true, when: "12 Apr, 19:02" },
  { label: "Seller ships to hub", done: true, when: "13 Apr, 10:44" },
  { label: "Inspection & packaging", done: true, when: "14 Apr, 14:11" },
  { label: "Dispatch to you", done: false, when: "Expected 18 Apr" },
];

export function MyBidsScreen() {
  // Integration: fetch from GET /api/v1/users/me/bids?status=active|scheduled|won
  const [tab, setTab] = useState<TabId>("active");
  const active = MY_BIDS.filter((b) => b.status === "leading" || b.status === "outbid");
  const scheduled = MY_BIDS.filter((b) => b.status === "scheduled");
  const list = tab === "active" ? active : tab === "scheduled" ? scheduled : WON_BIDS;
  const firstOutbid = active.find((b) => b.status === "outbid");

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">My bids</h1>

      <div className="my-3 grid auto-cols-fr grid-flow-col rounded-[10px] border border-line bg-surface p-[3px]">
        {(
          [
            { id: "active", label: "Active", count: active.length },
            { id: "scheduled", label: "Scheduled", count: scheduled.length },
            { id: "won", label: "Won", count: WON_BIDS.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[7px] border-none px-1.5 py-2 text-center text-[12px] ${
              tab === t.id ? "bg-accent/[0.12] font-semibold text-accent" : "bg-transparent font-medium text-fg-muted"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="rounded bg-white/[0.04] px-1.5 py-px font-mono text-[10px]">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "active" && firstOutbid && (
        <div className="mb-3 rounded-[14px] border border-red/20 bg-red/[0.06] p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="text-red">
              <Icon name="flame" size={18} />
            </div>
            <div className="flex-1 text-[13px]">
              You&apos;ve been outbid on <strong>{lookup(firstOutbid.id).title}</strong>
            </div>
            <Link
              href={`/dashboard/auction/${firstOutbid.id}`}
              className="text-xs font-semibold text-red"
            >
              Raise →
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {list.length === 0 ? (
          <div className="py-8 text-center text-fg-dim">Nothing here yet.</div>
        ) : (
          list.map((b) => <BidRow key={b.id} bid={b} auction={lookup(b.id)} />)
        )}
      </div>

      {tab === "won" && (
        <div className="mt-3 rounded-[14px] border border-line bg-surface p-3.5">
          <div className="mb-2 text-[13px] font-semibold">iPad Pro 11&quot; — Delivery</div>
          <div className="flex flex-col gap-2.5 text-xs">
            {DELIVERY_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full ${
                    s.done ? "bg-green text-[#0a0806]" : "bg-surface-2 text-fg-dim"
                  }`}
                >
                  {s.done && <Icon name="check" size={11} strokeWidth={2.5} />}
                </div>
                <span className={`flex-1 ${s.done ? "text-fg" : "text-fg-muted"}`}>{s.label}</span>
                <span className="font-mono text-[11px] text-fg-dim">{s.when}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
