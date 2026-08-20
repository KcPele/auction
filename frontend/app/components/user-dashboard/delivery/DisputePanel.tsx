"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCreateDispute,
  useMyDisputes,
} from "@/app/components/users/hooks/use-users";
import { ApiError } from "@/app/lib/api/error";
import { disputeReasonSchema } from "./dispute-validation";

const STATUS_LABEL = {
  OPEN: "Open",
  INVESTIGATING: "Under review",
  RESOLVED: "Resolved",
} as const;

const STATUS_STYLE = {
  OPEN: {
    panel: "border-warning/30 bg-warning-soft",
    badge: "border-warning/30 text-warning",
  },
  INVESTIGATING: {
    panel: "border-info/30 bg-info-soft",
    badge: "border-info/30 text-info",
  },
  RESOLVED: {
    panel: "border-success/30 bg-success-soft",
    badge: "border-success/30 text-success",
  },
} as const;

export function DisputePanel({ auctionId }: { auctionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const disputes = useMyDisputes();
  const create = useCreateDispute();
  const existing = useMemo(
    () => disputes.data?.find((item) => item.auctionId === auctionId),
    [auctionId, disputes.data],
  );

  const submit = async () => {
    const parsed = disputeReasonSchema.safeParse(reason);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Describe the issue");
      return;
    }
    try {
      await create.mutateAsync({ auctionId, reason: parsed.data });
      setReason("");
      setIsOpen(false);
      toast.success("Issue submitted for administrator review");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not submit issue",
      );
    }
  };

  if (existing) {
    const style = STATUS_STYLE[existing.status];
    return (
      <section className={`mt-6 rounded-xl border p-4 ${style.panel}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Delivery issue</h2>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}>
            {STATUS_LABEL[existing.status]}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{existing.reason}</p>
        {existing.resolution && (
          <div className="mt-3 rounded-lg border border-border bg-surface p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Resolution
            </div>
            <p className="mt-1 text-sm text-foreground">{existing.resolution}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Something wrong with the delivery?
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Report an issue and an administrator will review it.
          </p>
        </div>
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning hover:border-warning"
          >
            Report issue
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4">
          <label htmlFor="delivery-issue" className="text-xs font-medium text-foreground">
            Describe the issue
          </label>
          <textarea
            id="delivery-issue"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Explain what happened and what you expected…"
            className="mt-1.5 w-full resize-y rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-primary"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={create.isPending}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {create.isPending ? "Submitting…" : "Submit issue"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
