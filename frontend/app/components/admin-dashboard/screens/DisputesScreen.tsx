"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminDisputes,
  useInvestigateDispute,
  useResolveDispute,
} from "@/app/components/admin/hooks/use-admin-extras";
import type { AdminDisputeDto } from "@/app/components/admin/api/extras.api";
import { ApiError } from "@/app/lib/api/error";
import { koboToNaira } from "@/app/lib/format/money";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { Modal } from "../../ui/Modal";
import { fmtNGN } from "../utils";
import { SectionHeader } from "./SectionHeader";

type Filter = "all" | "OPEN" | "INVESTIGATING" | "RESOLVED";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "border-red/30 bg-red/[0.08] text-red",
  INVESTIGATING: "border-accent/30 bg-accent/10 text-accent",
  RESOLVED: "border-green/30 bg-green/[0.08] text-green",
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "INVESTIGATING", label: "Investigating" },
  { id: "RESOLVED", label: "Resolved" },
];

export function DisputesScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError, refetch } = useAdminDisputes({
    status: filter === "all" ? undefined : filter,
  });
  const investigate = useInvestigateDispute();
  const resolve = useResolveDispute();

  const [resolving, setResolving] = useState<AdminDisputeDto | null>(null);
  const [resolution, setResolution] = useState("");

  const items = data?.items ?? [];

  const onInvestigate = async (id: string) => {
    try {
      await investigate.mutateAsync(id);
      toast.success("Marked as investigating");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not update dispute");
    }
  };

  const onResolve = async () => {
    if (!resolving) return;
    if (resolution.trim().length < 3) {
      toast.error("Resolution required");
      return;
    }
    try {
      await resolve.mutateAsync({ id: resolving.id, resolution });
      toast.success("Dispute resolved");
      setResolving(null);
      setResolution("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not resolve");
    }
  };

  return (
    <>
      <SectionHeader
        title="Disputes & chargebacks"
        sub="Open cases. Move to investigation, then resolve against the record."
      />

      <Card>
        <CardHead
          title={`Cases · ${data?.total ?? items.length}`}
          controls={
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] capitalize ${
                    filter === f.id
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        />
        <CardBody flush>
          {isLoading ? (
            <div className="px-[18px] py-8 text-center text-xs italic text-fg-dim">
              Loading…
            </div>
          ) : isError ? (
            <div className="px-[18px] py-8 text-center text-xs italic text-fg-dim">
              Could not load.{" "}
              <button onClick={() => refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-[18px] py-8 text-center text-xs text-fg-muted">
              No cases.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((d) => {
                const amt = koboToNaira(
                  typeof d.amountKobo === "string"
                    ? Number(d.amountKobo)
                    : d.amountKobo,
                );
                return (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-3 px-3.5 py-3.5 sm:px-[18px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-fg-muted">
                          {d.id.slice(0, 8)}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[d.status] ?? ""}`}
                        >
                          {d.status}
                        </span>
                        <span className="text-[11px] text-fg-dim">
                          · {timeAgo(new Date(d.createdAt))}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium">{d.reason}</div>
                      <div className="mt-0.5 text-xs text-fg-muted">
                        Auction {d.auctionId.slice(0, 8)} · {fmtNGN(amt)}
                      </div>
                      {d.resolution && (
                        <div className="mt-1.5 rounded border border-line bg-bg-1 p-2 text-[11px] text-fg-muted">
                          <span className="font-semibold">Resolution:</span>{" "}
                          {d.resolution}
                        </div>
                      )}
                    </div>
                    {d.status === "OPEN" && (
                      <button
                        type="button"
                        disabled={investigate.isPending}
                        onClick={() => onInvestigate(d.id)}
                        className="rounded-md border border-line px-3 py-1.5 text-[11px] font-medium text-fg-muted hover:border-accent/40 hover:bg-accent/5 hover:text-accent disabled:opacity-60"
                      >
                        Start review
                      </button>
                    )}
                    {d.status !== "RESOLVED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolving(d);
                          setResolution("");
                        }}
                        className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-[11px] font-semibold text-green hover:bg-green/15"
                      >
                        Resolve
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolve dispute"
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResolving(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resolve.isPending}
              onClick={onResolve}
              className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-60"
            >
              {resolve.isPending ? "Resolving…" : "Confirm resolution"}
            </button>
          </>
        }
      >
        <label className="block text-xs font-medium text-fg-muted">
          Resolution
        </label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={3}
          placeholder="e.g. Full refund issued to buyer"
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
      </Modal>
    </>
  );
}
