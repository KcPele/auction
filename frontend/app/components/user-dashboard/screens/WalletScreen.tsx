"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLedger } from "@/app/components/wallet/hooks/use-wallet";
import {
  BUCKET_FOR,
  ICON_BG,
  ICON_FOR,
  type ActivityBucket,
} from "@/app/components/wallet/utils/ledger-display";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Icon } from "../primitives/Icon";
import { Chips, type ChipOption } from "../widgets/Chips";
import { WalletHero } from "../widgets/WalletHero";
import { fmtNaira } from "../utils";

type Filter = "all" | ActivityBucket;
const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All activity" },
  { id: "top", label: "Top-ups" },
  { id: "hold", label: "Holds" },
  { id: "release", label: "Released" },
  { id: "pay", label: "Settled" },
];

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function WalletScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError, refetch } = useLedger({ limit: 50 });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((e) => BUCKET_FOR[e.type] === filter);
  }, [data, filter]);

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Wallet
      </h1>

      <WalletHero />

      <div className="mt-1 rounded-[14px] border border-accent/15 bg-accent/[0.04] p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-accent">
            <Icon name="lock" size={18} />
          </div>
          <div>
            <div className="mb-0.5 text-[13px] font-semibold">How holds work</div>
            <div className="text-xs leading-[1.5] text-fg-muted">
              Every bid places a hold on your wallet. Lose the auction — hold released
              instantly. Win — hold applies to the balance.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-3">
        {isLoading && !data ? (
          <LedgerSkeleton />
        ) : isError ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            Could not load activity.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-accent hover:text-accent-2"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            No activity yet.
          </div>
        ) : (
          filtered.map((l) => {
            const bucket = BUCKET_FOR[l.type];
            return (
              <div
                key={l.id}
                className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-line py-3 last:border-b-0"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] font-bold ${ICON_BG[bucket]}`}
                >
                  <Icon name={ICON_FOR[bucket]} size={14} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[13px] font-medium">{l.description}</div>
                  <div className="mt-0.5 text-[11px] text-fg-dim">
                    {l.reference ? `${l.reference} · ` : ""}
                    {timeAgo(l.createdAt)}
                  </div>
                </div>
                <div
                  className={`text-right font-mono text-sm font-semibold tabular-nums ${
                    l.amount > 0 ? "text-green" : "text-red"
                  }`}
                >
                  {l.amount > 0 ? "+" : ""}
                  {fmtNaira(l.amount)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        href="/dashboard/wallet/topup"
        className="mt-6 block cursor-pointer rounded-xl px-5 py-3.5 text-center text-sm font-bold text-[#1a0a00]"
        style={PRIMARY_BTN_BG}
      >
        + Top up wallet
      </Link>

      <Link
        href="/dashboard/wallet/withdrawals"
        className="mt-2 block rounded-xl border border-line bg-surface px-5 py-3.5 text-center text-sm font-medium text-fg-muted"
      >
        Withdrawal history
      </Link>
    </>
  );
}

function LedgerSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-line py-3"
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </>
  );
}
