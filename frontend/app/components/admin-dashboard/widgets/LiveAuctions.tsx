"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminAuctions,
  useCancelAuction,
} from "@/app/components/admin/hooks/use-admin-dashboard";
import type { AdminAuctionItem } from "@/app/components/admin/types/dashboard.types";
import { ApiError } from "@/app/lib/api/error";
import { useNow } from "@/app/lib/format/use-now";
import { Card, CardBody, CardHead } from "./Card";
import { Modal } from "../../ui/Modal";
import { fmtNGN, fmtDuration } from "../utils";

export function LiveAuctions() {
  const now = useNow();
  const { data, isLoading, isError, refetch } = useAdminAuctions({
    status: "LIVE",
    limit: 10,
  });
  const cancel = useCancelAuction();

  const [cancelling, setCancelling] = useState<AdminAuctionItem | null>(null);
  const [reason, setReason] = useState("");

  const items = data?.items ?? [];

  const onConfirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync({
        id: cancelling.id,
        reason: reason || undefined,
      });
      toast.success("Auction cancelled");
      setCancelling(null);
      setReason("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not cancel");
    }
  };

  return (
    <Card>
      <CardHead
        title={
          <>
            Live auctions
            <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
              {items.length} running
            </span>
          </>
        }
      />
      <CardBody flush>
        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
            Loading…
          </div>
        ) : isError ? (
          <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
            Could not load.{" "}
            <button onClick={() => refetch()} className="text-accent">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
            No auctions live right now.
          </div>
        ) : (
          items.map((a) => {
            const endsIn =
              now === null
                ? null
                : Math.max(0, Math.floor((a.endsAt.getTime() - now) / 1000));
            return (
              <div
                key={a.id}
                className="border-b border-line px-3.5 py-3 last:border-b-0 hover:bg-accent/[0.03] sm:px-[18px]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {a.title}
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-accent-2">
                    ⏱ {endsIn === null ? "…" : fmtDuration(endsIn)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-dim">
                  <span>
                    {a.bidderCount} bidders · {a.holdPercent}% hold
                  </span>
                  <span className="font-mono font-semibold text-fg">
                    {fmtNGN(a.currentBid)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCancelling(a)}
                    className="rounded-md border border-red/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10"
                  >
                    Cancel auction
                  </button>
                </div>
              </div>
            );
          })
        )}
      </CardBody>

      <Modal
        open={!!cancelling}
        onClose={() => {
          setCancelling(null);
          setReason("");
        }}
        title={cancelling ? `Cancel · ${cancelling.title}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setCancelling(null);
                setReason("");
              }}
              className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              Keep running
            </button>
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={onConfirmCancel}
              className="rounded-md border border-red/30 bg-red/[0.08] px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15 disabled:opacity-60"
            >
              {cancel.isPending ? "Cancelling…" : "Confirm cancel"}
            </button>
          </>
        }
      >
        <p className="mb-4 text-[13px] text-fg-muted">
          Cancelling releases all bidder holds. This cannot be undone. State a
          reason for the audit log.
        </p>
        <label className="block text-xs font-medium text-fg-muted">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Listing issue surfaced after start."
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent placeholder:text-fg-dim"
        />
      </Modal>
    </Card>
  );
}
