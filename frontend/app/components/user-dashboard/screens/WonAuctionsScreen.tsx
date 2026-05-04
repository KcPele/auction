"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";
import type { WonAuction } from "../types";

const MOCK_WON: WonAuction[] = [
  {
    id: "a-4460",
    auctionTitle: "2019 Toyota Camry XLE",
    winningBid: 12_800_000,
    status: "AWAITING_PAYMENT",
    paymentDeadline: "2026-05-05T12:00:00Z",
  },
  {
    id: "a-4455",
    auctionTitle: "iPhone 15 Pro Max · 256GB",
    winningBid: 985_000,
    status: "PAYMENT_CONFIRMED",
    deliveryStatus: "SELLER_SHIPS",
  },
  {
    id: "a-4440",
    auctionTitle: 'MacBook Pro 14" M3 Pro',
    winningBid: 1_850_000,
    status: "SETTLED",
    deliveryStatus: "DELIVERED",
  },
];

function statusBadge(status: WonAuction["status"]) {
  const map: Record<WonAuction["status"], { label: string; cls: string }> = {
    AWAITING_PAYMENT: { label: "Pay now", cls: "border-red/30 bg-red/10 text-red" },
    PAYMENT_CONFIRMED: { label: "Confirmed", cls: "border-green/30 bg-green/10 text-green" },
    SETTLED: { label: "Settled", cls: "border-green/30 bg-green/10 text-green" },
    DEFAULTED: { label: "Defaulted", cls: "border-line bg-surface-2 text-fg-dim" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function WonAuctionsScreen() {
  // Integration: GET /api/v1/users/me/won-auctions
  const [won] = useState<WonAuction[]>(MOCK_WON);
  const router = useRouter();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">Won auctions</h1>
        <span className="text-xs text-fg-dim">{won.length} items</span>
      </div>

      {won.length === 0 ? (
        <div className="mt-12 text-center text-sm text-fg-muted">
          <Icon name="gavel" size={40} className="mx-auto mb-3 text-fg-dim" />
          <p>No won auctions yet. Keep bidding!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {won.map((w) => (
            <div
              key={w.id}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold">{w.auctionTitle}</div>
                  <div className="mt-1 font-mono text-[16px] font-bold text-accent-light">
                    {fmtNaira(w.winningBid)}
                  </div>
                </div>
                {statusBadge(w.status)}
              </div>

              {w.status === "AWAITING_PAYMENT" && (
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/auction/${w.id}/payment`)}
                  className="mt-3 w-full rounded-lg border-none p-2.5 text-xs font-bold text-[#1a0a00] accent-gradient-bg"
                >
                  View payment instructions
                </button>
              )}

              {w.deliveryStatus && w.status !== "AWAITING_PAYMENT" && (
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/auction/${w.id}/delivery`)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface p-2.5 text-xs font-medium text-fg"
                >
                  <Icon name="truck" size={14} /> Track delivery
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
