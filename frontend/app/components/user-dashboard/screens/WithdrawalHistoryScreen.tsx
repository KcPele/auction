"use client";
import { useState } from "react";
import { useMyWithdrawals } from "@/app/components/wallet/hooks/use-wallet";
import type {
  WithdrawalStatus,
  Withdrawal,
} from "@/app/components/wallet/types/wallet.types";
import { WithdrawalForm } from "@/app/components/wallet/widgets/WithdrawalForm";
import { fmtNaira } from "../utils";
import { Icon } from "../primitives/Icon";
import { Chips, type ChipOption } from "../widgets/Chips";

type Filter = "all" | WithdrawalStatus;

const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "COMPLETED", label: "Completed" },
  { id: "FAILED", label: "Failed" },
];

const STATUS_STYLE: Record<WithdrawalStatus, string> = {
  PENDING: "bg-accent/[0.12] text-accent",
  PROCESSING: "bg-[rgba(107,176,255,0.12)] text-[var(--blue)]",
  COMPLETED: "bg-green/[0.12] text-green",
  FAILED: "bg-red/[0.12] text-red",
  REVERSED: "bg-red/[0.12] text-red",
};

const formatDate = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function WithdrawalHistoryScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, refetch } = useMyWithdrawals({
    limit: 50,
    status: filter === "all" ? undefined : filter,
  });

  const items = data?.items ?? [];

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
          Withdrawals
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg px-3 py-2 text-xs font-bold text-[#1a0a00]"
          style={{
            background:
              "linear-gradient(180deg, var(--accent-light), var(--accent))",
          }}
        >
          New withdrawal
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-[14px] border border-line bg-surface p-4">
          <div className="mb-3 text-[15px] font-semibold tracking-tight">
            New withdrawal
          </div>
          <WithdrawalForm onClose={() => setShowForm(false)} />
        </div>
      )}

      <div className="mt-3">
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {isLoading && !data ? (
          <Skeleton />
        ) : isError ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            Could not load withdrawals.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-accent hover:text-accent-2"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            No withdrawals yet.
          </div>
        ) : (
          items.map((w) => <WithdrawalCard key={w.id} w={w} />)
        )}
      </div>
    </>
  );
}

function WithdrawalCard({ w }: { w: Withdrawal }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-3.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[15px] font-semibold tabular-nums">
            {fmtNaira(w.amount)}
          </div>
          <div className="mt-1 text-[11px] text-fg-dim">
            {w.bankName} · {w.accountNumberMasked}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[w.status]}`}
        >
          {w.status.toLowerCase()}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-dim">
        <Icon name="clock" size={12} />
        <span>Requested {formatDate.format(w.createdAt)}</span>
        {w.completedAt && (
          <span>· Completed {formatDate.format(w.completedAt)}</span>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[14px] border border-line bg-surface p-3.5"
        >
          <div className="space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </>
  );
}
