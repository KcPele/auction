"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "../primitives/Icon";
import { WalletHero } from "../widgets/WalletHero";
import { Chips, type ChipOption } from "../widgets/Chips";
import { ACTIVITY } from "../data";
import { fmtNaira } from "../utils";
import type { ActivityType } from "../types";

type Filter = "all" | ActivityType;
const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All activity" },
  { id: "top", label: "Top-ups" },
  { id: "hold", label: "Holds" },
  { id: "release", label: "Released" },
  { id: "pay", label: "Settled" },
];

const ICON_FOR: Record<ActivityType, IconName> = {
  top: "arrow-down",
  hold: "lock",
  release: "refresh",
  pay: "check",
};

const ICON_BG: Record<ActivityType, string> = {
  top: "bg-green/[0.12] text-green",
  hold: "bg-accent/[0.12] text-accent",
  release: "bg-[rgba(107,176,255,0.12)] text-[var(--blue)]",
  pay: "bg-red/[0.12] text-red",
};

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function WalletScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(
    () => (filter === "all" ? ACTIVITY : ACTIVITY.filter((x) => x.type === filter)),
    [filter],
  );

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Wallet</h1>

      <WalletHero />

      <div className="mt-1 rounded-[14px] border border-accent/15 bg-accent/[0.04] p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-accent">
            <Icon name="lock" size={18} />
          </div>
          <div>
            <div className="mb-0.5 text-[13px] font-semibold">How holds work</div>
            <div className="text-xs leading-[1.5] text-fg-muted">
              Every bid places a 10% hold on your wallet. Lose the auction — hold released
              instantly. Win — hold applies to the balance.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-3">
        {filtered.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-line py-3 last:border-b-0"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] font-bold ${ICON_BG[l.type]}`}
            >
              <Icon name={ICON_FOR[l.type]} size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[13px] font-medium">{l.title}</div>
              <div className="mt-0.5 text-[11px] text-fg-dim">
                {l.sub} · {l.time}
              </div>
            </div>
            <div
              className={`text-right font-mono text-sm font-semibold tabular-nums ${
                l.amt > 0 ? "text-green" : "text-red"
              }`}
            >
              {l.amt > 0 ? "+" : ""}
              {fmtNaira(l.amt)}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/wallet/topup"
        className="mt-6 block cursor-pointer rounded-xl px-5 py-3.5 text-center text-sm font-bold text-[#1a0a00]"
        style={PRIMARY_BTN_BG}
      >
        + Top up wallet
      </Link>
    </>
  );
}
