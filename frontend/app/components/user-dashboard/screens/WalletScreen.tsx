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

export function WalletScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(
    () => (filter === "all" ? ACTIVITY : ACTIVITY.filter((x) => x.type === filter)),
    [filter],
  );

  return (
    <>
      <h1 className="dash-page-title">Wallet</h1>

      <WalletHero />

      <div
        className="dash-card"
        style={{
          marginTop: 4,
          background: "rgba(232,183,85,0.04)",
          borderColor: "rgba(232,183,85,0.15)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ color: "var(--accent)", marginTop: 2 }}>
            <Icon name="lock" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>How holds work</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.5 }}>
              Every bid places a 10% hold on your wallet. Lose the auction — hold released
              instantly. Win — hold applies to the balance.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div style={{ marginTop: 12 }}>
        {filtered.map((l) => (
          <div key={l.id} className="dash-ledger-item">
            <div className={`dash-ledger-icon ${l.type}`}>
              <Icon name={ICON_FOR[l.type]} size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="dash-ledger-title">{l.title}</div>
              <div className="dash-ledger-sub">
                {l.sub} · {l.time}
              </div>
            </div>
            <div className={`dash-ledger-amt ${l.amt > 0 ? "pos" : "neg"}`}>
              {l.amt > 0 ? "+" : ""}
              {fmtNaira(l.amt)}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/wallet/topup"
        className="dash-bid-bar-btn"
        style={{ display: "block", textAlign: "center", marginTop: 24 }}
      >
        + Top up wallet
      </Link>
    </>
  );
}
