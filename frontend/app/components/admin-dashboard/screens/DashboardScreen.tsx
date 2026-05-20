"use client";
import { useState } from "react";
import {
  useDashboardStats,
  useAdminLedger,
  useAdminAuctions,
} from "@/app/components/admin/hooks/use-admin-dashboard";
import {
  usePendingApplications,
  usePendingListings,
} from "@/app/components/admin/hooks/use-admin-listings";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { KPICard } from "../widgets/KPICard";
import { LiveFeed } from "../widgets/LiveFeed";
import { LiveAuctions } from "../widgets/LiveAuctions";
import { Queue } from "../widgets/Queue";
import { Health } from "../widgets/Health";
import { Ledger } from "../widgets/Ledger";
import { downloadCSV, fmtNGNShort } from "../utils";
import type { Range } from "../types";

const RANGE_LABEL: Record<Range, string> = {
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function DashboardScreen() {
  const [range, setRange] = useState<Range>("24h");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: me } = useMe();
  const { data: stats } = useDashboardStats(range);
  const ledger = useAdminLedger({ limit: 50 });
  const liveAuctions = useAdminAuctions({ status: "LIVE", limit: 1 });
  const pendingListings = usePendingListings();
  const pendingApps = usePendingApplications();

  const liveCount = liveAuctions.data?.total ?? 0;
  const pendingListingCount = pendingListings.data?.length ?? 0;
  const pendingAppCount = pendingApps.data?.length ?? 0;

  const exportReport = () => {
    const items = ledger.data?.items ?? [];
    downloadCSV(`bidnaija-dashboard-${range}-${Date.now()}.csv`, [
      ["Metric", "Value"],
      ["Range", range],
      ["GMV", stats?.gmv ?? 0],
      ["Auctions settled", stats?.auctionsSettled ?? 0],
      ["Wallet holds", stats?.walletHolds ?? 0],
      ["Active bids", stats?.activeBids ?? 0],
      ["Payment success rate", `${stats?.paymentSuccessRate ?? 0}%`],
      [],
      ["Time", "Entry ID", "User", "Action", "Reference", "Direction", "Amount"],
      ...items.map((l) => [
        l.ts.toISOString(),
        l.id,
        l.handle,
        l.action,
        l.ref ?? "",
        l.direction,
        l.amount,
      ]),
    ]);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-[32px]">
            {me ? `Hi, ${me.firstName}.` : "Admin dashboard."}
          </h1>
          <div className="mt-1 text-[13px] text-fg-muted">
            {dateFmt.format(new Date())} · {liveCount} auction
            {liveCount === 1 ? "" : "s"} running · {pendingListingCount}{" "}
            listings + {pendingAppCount} applications awaiting review
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
          value={stats ? fmtNGNShort(stats.gmv) : "—"}
          delta="settled total"
          deltaDir="flat"
          spark={[]}
          sparkColor="var(--accent)"
        />
        <KPICard
          label={`Auctions settled · ${range}`}
          value={stats ? stats.auctionsSettled.toLocaleString() : "—"}
          delta="closed payouts"
          deltaDir="flat"
          spark={[]}
          sparkColor="var(--green)"
        />
        <KPICard
          label="Wallet holds · active"
          value={stats ? fmtNGNShort(stats.walletHolds) : "—"}
          delta={
            stats
              ? `across ${stats.activeBids} bid${stats.activeBids === 1 ? "" : "s"}`
              : "—"
          }
          deltaDir="flat"
          spark={[]}
          sparkColor="var(--accent-2)"
        />
        <KPICard
          label={`Payment success · ${range}`}
          value={stats ? `${stats.paymentSuccessRate}%` : "—"}
          delta="confirmed vs failed"
          deltaDir="flat"
          spark={[]}
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
