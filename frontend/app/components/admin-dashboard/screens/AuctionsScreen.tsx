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
import { fmtNGN, fmtDuration } from "../utils";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { Modal } from "../../ui/Modal";
import { SectionHeader } from "./SectionHeader";

const STATUS_OPTS = [
  { id: "all", label: "All" },
  { id: "LIVE", label: "Live" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "ENDED", label: "Ended" },
  { id: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { id: "SETTLED", label: "Settled" },
  { id: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLE: Record<string, string> = {
  LIVE: "bg-red/15 text-red border-red/30",
  SCHEDULED: "bg-accent/15 text-accent border-accent/30",
  ENDED: "bg-surface-2 text-fg-muted border-line",
  AWAITING_PAYMENT: "bg-[rgba(245,177,63,0.15)] text-[#f5b13f] border-[rgba(245,177,63,0.3)]",
  SETTLED: "bg-green/15 text-green border-green/30",
  CANCELLED: "bg-surface-2 text-fg-dim border-line",
  DEFAULTED: "bg-red/15 text-red border-red/30",
};

export function AuctionsScreen() {
  const now = useNow();
  const [status, setStatus] = useState<string>("LIVE");
  const { data, isLoading, isError, refetch } = useAdminAuctions({
    status: status === "all" ? undefined : status,
    limit: 50,
  });
  const cancel = useCancelAuction();
  const [cancelling, setCancelling] = useState<AdminAuctionItem | null>(null);
  const [reason, setReason] = useState("");

  const items = data?.items ?? [];

  const onCancel = async () => {
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
    <>
      <SectionHeader
        title="Auction monitor"
        sub="All auctions across categories and statuses. Intervene on suspicious bidding, extend, or cancel with full hold release."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_OPTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              status === s.id
                ? "border border-accent bg-accent/[0.12] text-accent"
                : "border border-line bg-surface text-fg-muted hover:bg-surface-2"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHead
          title={
            <>
              {status === "all" ? "All auctions" : status}
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {data?.total ?? 0} total
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
              No auctions match those filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr>
                    {[
                      "Title",
                      "Category",
                      "Status",
                      "Current bid",
                      "Bidders",
                      "Ends",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => {
                    const endsIn =
                      now === null
                        ? null
                        : Math.max(0, Math.floor((a.endsAt.getTime() - now) / 1000));
                    return (
                      <tr key={a.id} className="hover:bg-surface-2/40">
                        <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                          {a.title}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[12px] uppercase text-fg-muted sm:px-[18px]">
                          {a.category === "cars" ? "CAR" : "GADGET"}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[a.status] ?? ""}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="border-b border-line px-3.5 py-3 font-mono text-[13px] font-semibold sm:px-[18px]">
                          {fmtNGN(a.currentBid)}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                          {a.bidderCount}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 font-mono text-[12px] text-fg-muted sm:px-[18px]">
                          {a.status === "LIVE" || a.status === "SCHEDULED"
                            ? endsIn === null
                              ? "…"
                              : fmtDuration(endsIn)
                            : a.endsAt.toLocaleDateString("en-NG", {
                                dateStyle: "medium",
                              })}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                          {(a.status === "LIVE" ||
                            a.status === "SCHEDULED") && (
                            <button
                              type="button"
                              onClick={() => setCancelling(a)}
                              className="rounded-md border border-red/30 px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

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
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Keep running
            </button>
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={onCancel}
              className="rounded-md border border-red/30 bg-red/[0.08] px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15 disabled:opacity-60"
            >
              {cancel.isPending ? "Cancelling…" : "Confirm cancel"}
            </button>
          </>
        }
      >
        <p className="mb-4 text-[13px] text-fg-muted">
          Cancelling releases all bidder holds. This cannot be undone.
        </p>
        <label className="block text-xs font-medium text-fg-muted">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
      </Modal>
    </>
  );
}
