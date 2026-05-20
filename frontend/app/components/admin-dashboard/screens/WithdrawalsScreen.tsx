"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllAdminWithdrawals,
  useAuthorizeWithdrawal,
  usePendingWithdrawals,
  useResendWithdrawalOtp,
} from "@/app/components/admin/hooks/use-admin-withdrawals";
import type { Withdrawal } from "@/app/components/wallet/types/wallet.types";
import { ApiError } from "@/app/lib/api/error";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { fmtNGN } from "../utils";
import { SectionHeader } from "./SectionHeader";

type Tab = "pending" | "completed" | "failed";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-amber/30 bg-amber/10 text-amber",
  PROCESSING: "border-[rgba(107,176,255,0.3)] bg-[rgba(107,176,255,0.1)] text-[var(--blue,#6bb0ff)]",
  COMPLETED: "border-green/30 bg-green/10 text-green",
  FAILED: "border-red/30 bg-red/10 text-red",
  REVERSED: "border-red/30 bg-red/10 text-red",
};

export function WithdrawalsScreen() {
  const [tab, setTab] = useState<Tab>("pending");

  const pending = usePendingWithdrawals();
  const completed = useAllAdminWithdrawals({
    status: "COMPLETED",
    limit: 50,
  });
  const failed = useAllAdminWithdrawals({ status: "FAILED", limit: 50 });

  const authorize = useAuthorizeWithdrawal();
  const resend = useResendWithdrawalOtp();

  const [otpFor, setOtpFor] = useState<Record<string, string>>({});

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

  const onAuthorize = async (w: Withdrawal) => {
    const code = otpFor[w.id]?.trim();
    if (!code) {
      toast.error("Enter the authorization code first");
      return;
    }
    try {
      await authorize.mutateAsync({ id: w.id, authorizationCode: code });
      toast.success("Withdrawal authorized");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not authorize");
    }
  };

  const onResend = async (w: Withdrawal) => {
    try {
      await resend.mutateAsync(w.id);
      toast.success("OTP resent");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not resend OTP");
    }
  };

  return (
    <>
      <SectionHeader
        title="Withdrawal authorization"
        sub="Pending payouts plus completed and failed history. Authorize requires OTP code provided by the operator."
      />

      <div className="mb-3 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={otpFor[w.id] ?? ""}
                    onChange={(e) =>
                      setOtpFor((p) => ({ ...p, [w.id]: e.target.value }))
                    }
                    placeholder="OTP / authorization code"
                    className="min-w-[200px] flex-1 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => onResend(w)}
                    disabled={resend.isPending}
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:border-accent/40 disabled:opacity-60"
                  >
                    {resend.isPending ? "Resending…" : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAuthorize(w)}
                    disabled={authorize.isPending}
                    className="rounded-lg border-none px-3 py-1.5 text-xs font-bold text-[#1a0a00] disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--accent-2), var(--accent))",
                    }}
                  >
                    {authorize.isPending ? "Authorizing…" : "Authorize"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
