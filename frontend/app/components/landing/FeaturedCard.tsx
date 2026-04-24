"use client";
import { useMemo } from "react";
import { Countdown } from "./Countdown";
import { Placeholder } from "./Placeholder";
import { Button } from "./primitives/Button";
import { LiveDot } from "./primitives/LiveDot";
import { useHeroBid } from "./hooks/useHeroBid";
import { fmtNaira } from "./utils";

const AVATARS = [
  { c: "#ff7a1a", l: "D" },
  { c: "#ffb347", l: "T" },
  { c: "#e8b755", l: "K" },
  { c: "#4ea85c", l: "B" },
  { c: "#ef4a3a", l: "O" },
];

export function FeaturedCard() {
  const endTarget = useMemo(
    () => Date.now() + 3 * 3600 * 1000 + 47 * 60 * 1000 + 12 * 1000,
    [],
  );
  const { currentBid, bidCount, bumped } = useHeroBid(4_850_000);
  const holdAmount = Math.round((currentBid * 0.1) / 1000) * 1000;

  return (
    <div
      className="relative rounded-lg border border-line-strong bg-[linear-gradient(180deg,var(--surface-2),var(--surface))] p-[22px] shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,180,90,0.05)] transition-transform duration-[400ms] [transform:perspective(1200px)_rotateY(-3deg)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateY(-1deg)_rotateX(1deg)_translateY(-4px)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red">
          <LiveDot />
          LIVE NOW · FEATURED
        </div>
        <div className="font-mono text-[11px] text-fg-dim">#AUC-4471</div>
      </div>

      <div className="mb-4 overflow-hidden rounded-md">
        <Placeholder aspect="16/10" kind="car" tag="EXTERIOR · 1/14" />
      </div>

      <h3 className="m-0 mb-1 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.015em] text-fg">
        2019 Toyota Camry XLE · Pearl White
      </h3>
      <div className="mb-4 text-[13px] text-fg-muted">
        Lagos · 68,420 km · Mechanic-verified by Damilare Olaniyi · 14 photos
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3 rounded-md border border-line bg-black/35 p-3.5">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-fg-dim">Current bid</div>
          <div
            className="font-mono text-[22px] font-semibold tabular-nums accent-gradient-text transition-all duration-300"
            style={{ transform: bumped ? "translateY(-2px)" : "none" }}
          >
            {fmtNaira(currentBid)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-fg-dim">Ends in</div>
          <Countdown target={endTarget} size="lg" label="" />
        </div>
      </div>

      <div className="mb-3.5 flex items-center justify-between text-xs text-fg-muted">
        <div className="flex items-center gap-2.5">
          <div className="flex">
            {AVATARS.map((a, i) => (
              <div
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-[#0a0806] first:ml-0 -ml-2"
                style={{ background: a.c }}
              >
                {a.l}
              </div>
            ))}
          </div>
          <span>{bidCount} bidders · +3 watching</span>
        </div>
        <span>10% hold · {fmtNaira(holdAmount)}</span>
      </div>

      <div className="flex gap-2.5">
        <Button variant="primary" className="flex-1 justify-center">
          Place a bid
        </Button>
        <Button variant="ghost" className="flex-1 justify-center">
          Full details
        </Button>
      </div>
    </div>
  );
}
