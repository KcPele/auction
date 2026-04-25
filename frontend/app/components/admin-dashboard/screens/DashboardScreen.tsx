"use client";
import { useState } from "react";
import { KPICard } from "../widgets/KPICard";
import { LiveFeed } from "../widgets/LiveFeed";
import { LiveAuctions } from "../widgets/LiveAuctions";
import { Queue } from "../widgets/Queue";
import { Health } from "../widgets/Health";
import { Ledger } from "../widgets/Ledger";
import { KPI_DATA, INITIAL_COUNTS, INITIAL_LEDGER } from "../data";
import { downloadCSV, fmtNGNShort } from "../utils";
import type { Range } from "../types";

const RANGE_LABEL: Record<Range, string> = {
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export function DashboardScreen() {
  const [range, setRange] = useState<Range>("24h");
  const [menuOpen, setMenuOpen] = useState(false);
  const k = KPI_DATA[range];

  const exportReport = () => {
    downloadCSV(`bidnaija-dashboard-${range}-${Date.now()}.csv`, [
      ["Metric", "Value", "Delta"],
      ["GMV", k.gmv.value, (k.gmv.delta ?? 0) + "%"],
      ["Auctions settled", k.settled.value, "+" + (k.settled.delta ?? 0)],
      ["Wallet holds", k.holds.value, (k.holds.count ?? 0) + " bids"],
      ["Payment success", k.success.value + "%", (k.success.delta ?? 0) + "%"],
      [],
      ["Time", "Entry ID", "User", "Action", "Reference", "Direction", "Amount (NGN)"],
      ...INITIAL_LEDGER.map((l) => [l.time, l.id, "@" + l.user, l.action, l.ref, l.dir, l.amt]),
    ]);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-[32px]">
            Good afternoon, Adaeze.
          </h1>
          <div className="mt-1 text-[13px] text-fg-muted">
            Friday · 24 April 2026 · 15:47 WAT · {INITIAL_COUNTS.auctions} auctions running ·{" "}
            {INITIAL_COUNTS.listings} listings awaiting review
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg"
            >
              {RANGE_LABEL[range]} ▾
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-lg border border-line-strong bg-surface p-1 shadow-2xl">
                {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRange(r);
                      setMenuOpen(false);
                    }}
                    className={`block w-full rounded px-3 py-2 text-left text-[13px] hover:bg-accent/5 hover:text-fg ${
                      range === r ? "bg-accent/10 text-fg" : "text-fg-muted"
                    }`}
                  >
                    {RANGE_LABEL[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={exportReport}
            className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg"
          >
            Export report
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={`GMV · ${range}`}
          value={fmtNGNShort(k.gmv.value)}
          delta={`${(k.gmv.delta ?? 0) > 0 ? "+" : ""}${k.gmv.delta}% vs prev`}
          deltaDir={(k.gmv.delta ?? 0) >= 0 ? "up" : "down"}
          spark={k.gmv.spark}
          sparkColor="var(--accent)"
        />
        <KPICard
          label={`Auctions settled · ${range}`}
          value={k.settled.value.toLocaleString()}
          delta={`+${k.settled.delta} vs prev`}
          deltaDir="up"
          spark={k.settled.spark}
          sparkColor="var(--green)"
        />
        <KPICard
          label="Wallet holds · active"
          value={fmtNGNShort(k.holds.value)}
          delta={`across ${k.holds.count} bids`}
          deltaDir="flat"
          spark={k.holds.spark}
          sparkColor="var(--accent-2)"
        />
        <KPICard
          label={`Payment success · ${range}`}
          value={`${k.success.value}%`}
          delta={`${(k.success.delta ?? 0) > 0 ? "+" : ""}${k.success.delta}% vs prev`}
          deltaDir={(k.success.delta ?? 0) >= 0 ? "up" : "down"}
          spark={k.success.spark}
          sparkColor="#6bb0ff"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <LiveFeed />
        <LiveAuctions />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Queue />
        <Health />
      </div>
      <div className="mt-4">
        <Ledger />
      </div>
    </>
  );
}
