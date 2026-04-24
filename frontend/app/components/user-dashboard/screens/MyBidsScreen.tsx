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
  ends: Date.now() - 1_000,
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
  const [tab, setTab] = useState<TabId>("active");
  const active = MY_BIDS.filter((b) => b.status === "leading" || b.status === "outbid");
  const scheduled = MY_BIDS.filter((b) => b.status === "scheduled");
  const list = tab === "active" ? active : tab === "scheduled" ? scheduled : WON_BIDS;
  const firstOutbid = active.find((b) => b.status === "outbid");

  return (
    <>
      <h1 className="dash-page-title">My bids</h1>

      <div className="dash-seg">
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
            className={`dash-seg-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} <span className="dash-seg-count">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "active" && firstOutbid && (
        <div
          className="dash-card"
          style={{
            background: "rgba(239,74,58,0.06)",
            borderColor: "rgba(239,74,58,0.2)",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ color: "var(--red)" }}>
              <Icon name="flame" size={18} />
            </div>
            <div style={{ flex: 1, fontSize: 13 }}>
              You&apos;ve been outbid on <strong>{lookup(firstOutbid.id).title}</strong>
            </div>
            <Link
              href={`/dashboard/auction/${firstOutbid.id}`}
              style={{ color: "var(--red)", fontWeight: 600, fontSize: 12 }}
            >
              Raise →
            </Link>
          </div>
        </div>
      )}

      <div className="dash-card">
        {list.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--fg-dim)" }}>
            Nothing here yet.
          </div>
        ) : (
          list.map((b) => <BidRow key={b.id} bid={b} auction={lookup(b.id)} />)
        )}
      </div>

      {tab === "won" && (
        <div className="dash-card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            iPad Pro 11&quot; — Delivery
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
            {DELIVERY_STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: s.done ? "var(--green)" : "var(--surface-2)",
                    color: s.done ? "#0a0806" : "var(--fg-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.done && <Icon name="check" size={11} strokeWidth={2.5} />}
                </div>
                <span style={{ flex: 1, color: s.done ? "var(--fg)" : "var(--fg-muted)" }}>
                  {s.label}
                </span>
                <span
                  className="dash-dim"
                  style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                >
                  {s.when}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
