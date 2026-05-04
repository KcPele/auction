"use client";
import { useState } from "react";
import { AdminIcon } from "../primitives/Icon";
import { SectionHeader } from "./SectionHeader";
import { fmtNGN } from "../utils";

interface PendingWithdrawal {
  id: string;
  user: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  requestedAt: string;
  status: "PENDING" | "OTP_SENT" | "AUTHORIZED";
}

const MOCK_WITHDRAWALS: PendingWithdrawal[] = [
  { id: "WD-301", user: "@damilare.o", bankName: "GTBank", accountNumber: "****4412", amount: 500_000, requestedAt: "2m ago", status: "PENDING" },
  { id: "WD-300", user: "@tunde.k", bankName: "Access Bank", accountNumber: "****8801", amount: 1_200_000, requestedAt: "18m ago", status: "OTP_SENT" },
  { id: "WD-299", user: "@nkem_a", bankName: "OPay", accountNumber: "****9023", amount: 304_000, requestedAt: "1h ago", status: "PENDING" },
];

export function WithdrawalsScreen() {
  // Integration: GET /api/v1/admin/wallet-withdrawals/pending
  const [items] = useState<PendingWithdrawal[]>(MOCK_WITHDRAWALS);

  return (
    <>
      <SectionHeader
        title="Withdrawal authorization"
        sub="Pending withdrawal requests. Send OTP, then authorize to release funds to the user's bank."
      />

      {items.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-muted">No pending withdrawals</div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((w) => (
            <div key={w.id} className="rounded-[14px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold">{w.user}</div>
                  <div className="mt-0.5 text-xs text-fg-dim">{w.bankName} · {w.accountNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[16px] font-bold text-accent">{fmtNGN(w.amount)}</div>
                  <div className="text-[11px] text-fg-dim">{w.requestedAt}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    w.status === "PENDING"
                      ? "border-amber/30 bg-amber/10 text-amber"
                      : w.status === "OTP_SENT"
                        ? "border-blue/30 bg-blue/10 text-blue"
                        : "border-green/30 bg-green/10 text-green"
                  }`}
                >
                  {w.status}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {w.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => {
                      // Integration: POST /api/v1/admin/wallet-withdrawals/{id}/resend-otp
                      alert(`OTP sent to ${w.user}`);
                    }}
                    className="flex-1 rounded-lg border border-line bg-surface p-2 text-xs font-medium text-fg hover:border-accent/40"
                  >
                    Send OTP
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Integration: POST /api/v1/admin/wallet-withdrawals/{id}/authorize { otp }
                    alert(`Authorizing withdrawal ${w.id}`);
                  }}
                  className="flex-1 rounded-lg border-none p-2 text-xs font-bold text-[#1a0a00]"
                  style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
                >
                  Authorize
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
