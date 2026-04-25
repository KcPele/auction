"use client";
import { useState } from "react";
import { Icon } from "../primitives/Icon";
import { Chips, type ChipOption } from "../widgets/Chips";

type WithdrawalStatus = "PENDING" | "COMPLETED" | "FAILED";
type Filter = "all" | WithdrawalStatus;

interface Withdrawal {
  id: string;
  amountKobo: number;
  destinationBank: string;
  destinationAccount: string;
  status: WithdrawalStatus;
  createdAt: string;
  completedAt?: string;
}

const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: "W-001", amountKobo: 500_000, destinationBank: "Zenith Bank", destinationAccount: "****3937", status: "COMPLETED", createdAt: "18 Apr, 14:22", completedAt: "18 Apr, 14:30" },
  { id: "W-002", amountKobo: 1_200_000, destinationBank: "GTBank", destinationAccount: "****1284", status: "PENDING", createdAt: "20 Apr, 09:15" },
  { id: "W-003", amountKobo: 250_000, destinationBank: "Access Bank", destinationAccount: "****5567", status: "FAILED", createdAt: "15 Apr, 11:40" },
  { id: "W-004", amountKobo: 800_000, destinationBank: "UBA", destinationAccount: "****8821", status: "COMPLETED", createdAt: "12 Apr, 16:05", completedAt: "12 Apr, 16:12" },
];

const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "COMPLETED", label: "Completed" },
  { id: "FAILED", label: "Failed" },
];

const STATUS_STYLE: Record<WithdrawalStatus, string> = {
  PENDING: "bg-accent/[0.12] text-accent",
  COMPLETED: "bg-green/[0.12] text-green",
  FAILED: "bg-red/[0.12] text-red",
};

export function WithdrawalHistoryScreen() {
  // Integration: fetch from GET /api/v1/wallets/me/withdrawals
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = filter === "all" ? MOCK_WITHDRAWALS : MOCK_WITHDRAWALS.filter((w) => w.status === filter);

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Withdrawals</h1>
      <div className="mt-3">
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="rounded-[14px] border border-line bg-surface p-3.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[15px] font-semibold tabular-nums">
                  ₦{w.amountKobo.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-fg-dim">
                  {w.destinationBank} · {w.destinationAccount}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[w.status]}`}>
                {w.status.toLowerCase()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-fg-dim">
              <Icon name="clock" size={12} />
              <span>Requested {w.createdAt}</span>
              {w.completedAt && <span>· Completed {w.completedAt}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-fg-dim">
            No withdrawals found.
          </div>
        )}
      </div>
    </>
  );
}
