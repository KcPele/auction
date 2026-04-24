"use client";
import { useState } from "react";
import { notFound } from "next/navigation";
import { Icon } from "../primitives/Icon";
import { Countdown } from "../widgets/Countdown";
import { AUCTIONS } from "../data";
import { fmtNaira } from "../utils";

interface HistoryEntry {
  user: string;
  amt: number;
  time: string;
  leading?: boolean;
  me?: boolean;
}

function buildHistory(current: number, inc: number): HistoryEntry[] {
  return [
    { user: "@tosin_x", amt: current, time: "2m ago", leading: true },
    { user: "@kemi.o", amt: current - inc, time: "6m ago" },
    { user: "@you", amt: current - inc * 2, time: "11m ago", me: true },
    { user: "@ahmad_b", amt: current - inc * 3, time: "18m ago" },
  ].filter((b) => b.amt > 0);
}

export function DetailScreen({ id }: { id: string }) {
  const a = AUCTIONS.find((x) => x.id === id);
  if (!a) notFound();

  const minIncrement = Math.max(5_000, Math.round(((a.current || 0) * 0.01) / 1000) * 1000);
  const suggested = (a.current || a.start) + minIncrement;
  const [bidAmt, setBidAmt] = useState(suggested);
  const [photo, setPhoto] = useState(0);
  const history = buildHistory(a.current || a.start, minIncrement);

  return (
    <>
      <div className="dash-detail-hero">
        <Icon name={a.cat === "cars" ? "car" : "phone"} size={70} style={{ color: "rgba(255,200,140,0.25)" }} />
        {a.live && (
          <span
            className="dash-tile-badge live"
            style={{ top: 14, left: 14, position: "absolute" }}
          >
            <span className="dash-live-dot" /> Live
          </span>
        )}
        <div className="dash-detail-hero-nav">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              className={`dash-detail-photo ${i === photo ? "active" : ""}`}
              onClick={() => setPhoto(i)}
            >
              <Icon name="image" size={14} />
            </button>
          ))}
          <div className="dash-detail-count">
            {photo + 1} / {a.photos || 6}
          </div>
        </div>
      </div>

      <div className="dash-detail-head">
        <h1 className="dash-detail-title">{a.title}</h1>
        <div className="dash-detail-meta">{a.meta}</div>
      </div>

      <div className="dash-detail-bid-row">
        <div>
          <div className="dash-detail-bid-lbl">{a.live ? "Current bid" : "Starts at"}</div>
          <div className="dash-detail-bid-val accent">{fmtNaira(a.live ? a.current : a.start)}</div>
          <div className="dash-dim" style={{ fontSize: 11, marginTop: 2 }}>
            {a.bids} bids placed
          </div>
        </div>
        <div>
          <div className="dash-detail-bid-lbl">{a.live ? "Ends in" : "Opens in"}</div>
          <Countdown target={a.ends} />
        </div>
      </div>

      <div className="dash-verified">
        <div className="dash-verified-icon">
          <Icon name="shield" size={16} />
        </div>
        <div className="dash-verified-text">
          <strong>Verified by BidNaija.</strong> Item inspected on{" "}
          {a.cat === "cars" ? "2 Apr" : "6 Apr"}. Seller KYC confirmed. Escrow release 48h after
          delivery.
        </div>
      </div>

      <div className="dash-facts">
        <div className="dash-fact">
          <div className="dash-fact-lbl">Seller</div>
          <div className="dash-fact-val">{a.seller}</div>
        </div>
        <div className="dash-fact">
          <div className="dash-fact-lbl">Location</div>
          <div className="dash-fact-val">{a.location}</div>
        </div>
        <div className="dash-fact">
          <div className="dash-fact-lbl">Reserve</div>
          <div className="dash-fact-val">{a.cat === "cars" ? "Hidden" : "No reserve"}</div>
        </div>
        <div className="dash-fact">
          <div className="dash-fact-lbl">Bid increment</div>
          <div className="dash-fact-val">{fmtNaira(minIncrement)}</div>
        </div>
      </div>

      {a.highlights && (
        <>
          <div className="dash-section-header">
            <div className="dash-section-h">Inspection highlights</div>
          </div>
          <div className="dash-card">
            {a.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "center" }}>
                <Icon name="check-c" size={16} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 13 }}>{h}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="dash-section-header">
        <div className="dash-section-h">Bid history</div>
      </div>
      <div className="dash-card">
        {history.map((b, i) => (
          <div key={i} className="dash-row" style={{ gridTemplateColumns: "1fr auto auto" }}>
            <div>
              <div
                className="dash-row-title"
                style={{ color: b.me ? "var(--accent-light)" : "var(--fg)" }}
              >
                {b.user}{" "}
                {b.me && (
                  <span className="dash-dim" style={{ fontSize: 10 }}>
                    · you
                  </span>
                )}
              </div>
              <div className="dash-row-meta">{b.time}</div>
            </div>
            <div className="dash-row-amt" style={{ marginRight: 10 }}>
              {fmtNaira(b.amt)}
            </div>
            {b.leading && <div className="dash-row-status leading">top</div>}
          </div>
        ))}
      </div>

      {a.live ? (
        <div className="dash-bid-bar">
          <div style={{ flex: 1 }}>
            <div className="dash-tile-bid-lbl" style={{ marginBottom: 4 }}>
              Your bid (min {fmtNaira(suggested)})
            </div>
            <input
              className="dash-bid-amt-input"
              type="text"
              value={fmtNaira(bidAmt)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                setBidAmt(n || 0);
              }}
            />
          </div>
          <button
            type="button"
            className="dash-bid-bar-btn"
            onClick={() =>
              alert(
                `Bid confirmed at ${fmtNaira(bidAmt)}.\n10% (${fmtNaira(bidAmt * 0.1)}) held from wallet.`,
              )
            }
          >
            Place bid
          </button>
        </div>
      ) : (
        <div className="dash-bid-bar">
          <button type="button" className="dash-bid-bar-btn" style={{ flex: 1 }}>
            <Icon name="bell" size={16} /> Remind me when it opens
          </button>
        </div>
      )}
    </>
  );
}
