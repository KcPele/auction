"use client";
import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { fmtNGN } from "../utils";

interface SettlementAuction {
  id: string;
  title: string;
  winner: string;
  winningBid: number;
  paidAt: string;
  status: "PAYMENT_CONFIRMED" | "SETTLED" | "DEFAULTED";
}

const MOCK_SETTLEMENTS: SettlementAuction[] = [
  { id: "AUC-4471", title: "iPhone 15 Pro Max · 256GB", winner: "@damilare.o", winningBid: 985_000, paidAt: "1h ago", status: "PAYMENT_CONFIRMED" },
  { id: "AUC-4468", title: "2019 Toyota Camry XLE", winner: "@nkem_a", winningBid: 12_800_000, paidAt: "3h ago", status: "PAYMENT_CONFIRMED" },
  { id: "AUC-4460", title: 'MacBook Pro 14" M3 Pro', winner: "@tunde.k", winningBid: 1_850_000, paidAt: "6h ago", status: "PAYMENT_CONFIRMED" },
];

export function SettlementScreen() {
  // Integration: GET /api/v1/admin/auctions?status=AWAITING_PAYMENT
  const [items] = useState<SettlementAuction[]>(MOCK_SETTLEMENTS);

  return (
    <>
      <SectionHeader
        title="Settlements"
        sub="Auctions where payment has been confirmed. Release escrow to seller or mark as defaulted."
      />

      {items.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-muted">No auctions pending settlement</div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((s) => (
            <div key={s.id} className="rounded-[14px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold">{s.title}</div>
                  <div className="mt-0.5 text-xs text-fg-dim">Winner: {s.winner} · {s.id}</div>
                  <div className="mt-0.5 text-[11px] text-fg-dim">Paid: {s.paidAt}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[16px] font-bold text-accent">{fmtNGN(s.winningBid)}</div>
                  <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                    {s.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Integration: POST /api/v1/admin/auctions/{id}/settle-payment
                    alert(`Settling ${s.id} — releasing escrow to seller`);
                  }}
                  className="flex-1 rounded-lg border-none p-2 text-xs font-bold text-[#1a0a00]"
                  style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
                >
                  Settle &amp; release escrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Integration: POST /api/v1/admin/auctions/{id}/default-payment
                    alert(`Marking ${s.id} as defaulted`);
                  }}
                  className="flex-1 rounded-lg border border-red/30 bg-red/[0.08] p-2 text-xs font-semibold text-red"
                >
                  Mark defaulted
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
