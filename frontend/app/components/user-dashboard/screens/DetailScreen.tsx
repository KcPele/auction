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

const HERO_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 10px, rgba(255,170,90,0.07) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
};

const BID_BAR_BG = {
  background: "linear-gradient(180deg, transparent, var(--bg) 20%)",
  paddingBottom: "calc(var(--nav-h) + 14px + env(safe-area-inset-bottom))",
};

const BID_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

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
      <div
        className="relative -mx-[18px] flex aspect-[4/3] items-center justify-center text-[rgba(255,200,140,0.3)]"
        style={HERO_BG}
      >
        <Icon name={a.cat === "cars" ? "car" : "phone"} size={70} />
        {a.live && (
          <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[5px] border border-red/30 bg-red/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-red">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" /> Live
          </span>
        )}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-black/50 backdrop-blur ${
                i === photo ? "border-accent text-accent" : "border-line text-fg-muted"
              }`}
              onClick={() => setPhoto(i)}
            >
              <Icon name="image" size={14} />
            </button>
          ))}
          <div className="ml-auto rounded-full border border-line bg-black/70 px-2.5 py-1.5 font-mono text-[11px]">
            {photo + 1} / {a.photos || 6}
          </div>
        </div>
      </div>

      <div className="py-4 pb-3">
        <h1 className="m-0 mb-1 font-display text-[22px] font-semibold leading-[1.15] tracking-tight">
          {a.title}
        </h1>
        <div className="text-xs text-fg-muted">{a.meta}</div>
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-2.5 rounded-[14px] border border-line bg-surface p-3.5">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            {a.live ? "Current bid" : "Starts at"}
          </div>
          <div className="font-mono text-[18px] font-semibold tabular-nums text-accent-light">
            {fmtNaira(a.live ? a.current : a.start)}
          </div>
          <div className="mt-0.5 text-[11px] text-fg-dim">{a.bids} bids placed</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            {a.live ? "Ends in" : "Opens in"}
          </div>
          <Countdown endsIn={a.endsIn} />
        </div>
      </div>

      <div className="my-3 flex items-center gap-2.5 rounded-lg border border-green/20 bg-green/[0.06] px-3.5 py-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green/[0.15] text-green">
          <Icon name="shield" size={16} />
        </div>
        <div className="text-[12px] leading-[1.45]">
          <strong className="text-green">Verified by BidNaija.</strong> Item inspected on{" "}
          {a.cat === "cars" ? "2 Apr" : "6 Apr"}. Seller KYC confirmed. Escrow release 48h after
          delivery.
        </div>
      </div>

      <div className="my-3.5 grid grid-cols-2 gap-2.5">
        {[
          { lbl: "Seller", val: a.seller },
          { lbl: "Location", val: a.location },
          { lbl: "Reserve", val: a.cat === "cars" ? "Hidden" : "No reserve" },
          { lbl: "Bid increment", val: fmtNaira(minIncrement) },
        ].map((f) => (
          <div key={f.lbl} className="rounded-lg border border-line bg-surface p-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-fg-dim">{f.lbl}</div>
            <div className="mt-0.5 text-sm font-medium">{f.val}</div>
          </div>
        ))}
      </div>

      {a.highlights && (
        <>
          <div className="my-3 mt-5 flex items-center justify-between">
            <div className="text-[15px] font-semibold tracking-tight">Inspection highlights</div>
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-3.5">
            {a.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <Icon name="check-c" size={16} className="text-green" />
                <span className="text-[13px]">{h}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="my-3 mt-5 flex items-center justify-between">
        <div className="text-[15px] font-semibold tracking-tight">Bid history</div>
      </div>
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {history.map((b, i) => (
          <div
            key={i}
            className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line py-3 last:border-b-0"
          >
            <div>
              <div className={`text-[13px] font-medium ${b.me ? "text-accent-light" : "text-fg"}`}>
                {b.user}{" "}
                {b.me && <span className="text-[10px] text-fg-dim">· you</span>}
              </div>
              <div className="text-[11px] text-fg-dim">{b.time}</div>
            </div>
            <div className="mr-2.5 text-right font-mono text-[13px] font-semibold tabular-nums">
              {fmtNaira(b.amt)}
            </div>
            {b.leading && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-green">
                top
              </div>
            )}
          </div>
        ))}
      </div>

      {a.live ? (
        <div
          className="sticky bottom-0 -mx-[18px] -mb-6 flex items-center gap-2.5 px-[18px] pt-3.5"
          style={BID_BAR_BG}
        >
          <div className="flex-1">
            <div className="mb-1 text-[9px] uppercase tracking-[0.08em] text-fg-dim">
              Your bid (min {fmtNaira(suggested)})
            </div>
            <input
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 font-mono text-base font-semibold text-fg outline-none focus:border-accent"
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
            className="cursor-pointer whitespace-nowrap rounded-xl border-none px-5 py-3.5 text-sm font-bold text-[#1a0a00]"
            style={BID_BTN_BG}
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
        <div
          className="sticky bottom-0 -mx-[18px] -mb-6 flex items-center gap-2.5 px-[18px] pt-3.5"
          style={BID_BAR_BG}
        >
          <button
            type="button"
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-none px-5 py-3.5 text-sm font-bold text-[#1a0a00]"
            style={BID_BTN_BG}
          >
            <Icon name="bell" size={16} /> Remind me when it opens
          </button>
        </div>
      )}
    </>
  );
}
