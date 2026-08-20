"use client";
import { useState } from "react";
import {
  useAllAdminWithdrawals,
  usePendingWithdrawals,
} from "@/app/components/admin/hooks/use-admin-withdrawals";
import type { Withdrawal } from "@/app/components/wallet/types/wallet.types";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { PaginationControls } from "../../ui/PaginationControls";
import { fmtNGN } from "../utils";
import { SectionHeader } from "./SectionHeader";

type Tab = "pending" | "completed" | "failed";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-warning/30 bg-warning-soft text-warning",
  PROCESSING: "border-info/30 bg-info-soft text-info",
  COMPLETED: "border-success/30 bg-success-soft text-success",
  FAILED: "border-danger/30 bg-danger-soft text-danger",
  REVERSED: "border-danger/30 bg-danger-soft text-danger",
};

export function WithdrawalsScreen() {
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const pending = usePendingWithdrawals(tab === "pending");
  const completed = useAllAdminWithdrawals(
    {
      status: "COMPLETED",
      limit: pageSize,
      offset: page * pageSize,
    },
    tab === "completed",
  );
  const failed = useAllAdminWithdrawals(
    {
      status: "FAILED",
      limit: pageSize,
      offset: page * pageSize,
    },
    tab === "failed",
  );

  const items: Withdrawal[] =
    tab === "pending"
      ? pending.data ?? []
      : tab === "completed"
        ? completed.data?.items ?? []
        : failed.data?.items ?? [];

  const isLoading =
    tab === "pending"
      ? pending.isLoading
      : tab === "completed"
        ? completed.isLoading
        : failed.isLoading;
  const isError =
    tab === "pending"
      ? pending.isError
      : tab === "completed"
        ? completed.isError
        : failed.isError;
  const total =
    tab === "completed"
      ? completed.data?.total ?? 0
      : tab === "failed"
        ? failed.data?.total ?? 0
        : items.length;
  const retry = () => {
    if (tab === "pending") return pending.refetch();
    if (tab === "completed") return completed.refetch();
    return failed.refetch();
  };

  return (
    <>
      <SectionHeader
        title="Withdrawals"
        sub="Monitor provider-processed payouts and review completed or failed history. Pending records refresh automatically."
      />

      <div className="mb-3 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(0);
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              tab === t.id
                ? "border border-accent bg-accent/[0.12] text-accent"
                : "border border-line bg-surface text-fg-muted hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
      ) : isError ? (
        <div className="py-10 text-center text-sm text-fg-dim">
          Could not load withdrawals.{" "}
          <button
            type="button"
            onClick={() => void retry()}
            className="text-accent"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-muted">
          No {tab} withdrawals.
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {items.map((w) => (
            <div
              key={w.id}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">
                    {w.accountName}
                  </div>
                  <div className="mt-0.5 text-xs text-fg-dim">
                    {w.bankName} · {w.accountNumberMasked}
                  </div>
                  {w.narration && (
                    <div className="mt-1 text-[11px] text-fg-dim">
                      {w.narration}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[16px] font-bold text-accent">
                    {fmtNGN(w.amount)}
                  </div>
                  <div className="text-[11px] text-fg-dim">
                    {timeAgo(w.createdAt)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[w.status] ?? ""}`}
                >
                  {w.status}
                </span>
                {w.completedAt && (
                  <span className="text-[10px] text-fg-dim">
                    completed {timeAgo(w.completedAt)}
                  </span>
                )}
              </div>

              {(w.status === "PENDING" || w.status === "PROCESSING") && (
                <p className="mt-3 text-xs text-fg-muted">
                  Awaiting the payment provider&apos;s status update.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab !== "pending" && !isError && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
