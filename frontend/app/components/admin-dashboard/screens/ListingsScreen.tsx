"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApproveApplication,
  usePendingApplications,
  useRejectApplication,
} from "@/app/components/admin/hooks/use-admin-listings";
import type { AdminListingApplication } from "@/app/components/admin/types/listings.types";
import { ApiError } from "@/app/lib/api/error";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Queue } from "../widgets/Queue";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

const CAT_BG: Record<string, string> = {
  cars: "bg-accent/10 text-accent",
  gadgets: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
};

export function ListingsScreen() {
  const apps = usePendingApplications();
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [reviewing, setReviewing] = useState<AdminListingApplication | null>(
    null,
  );
  const [note, setNote] = useState("");

  const items = apps.data ?? [];
  const isPending = approve.isPending || reject.isPending;

  const wrapErr = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) toast.error(err.message);
    else toast.error(fallback);
  };

  const onApprove = async (a: AdminListingApplication) => {
    try {
      await approve.mutateAsync({ id: a.id, reviewNote: note || undefined });
      toast.success("Application approved");
      setReviewing(null);
      setNote("");
    } catch (err) {
      wrapErr(err, "Could not approve");
    }
  };

  const onReject = async (a: AdminListingApplication) => {
    try {
      await reject.mutateAsync({ id: a.id, reviewNote: note || undefined });
      toast.success("Application rejected");
      setReviewing(null);
      setNote("");
    } catch (err) {
      wrapErr(err, "Could not reject");
    }
  };

  return (
    <>
      <SectionHeader
        title="Listing approvals"
        sub="Listings awaiting approval. Verify mechanic reports for cars, and proof-of-ownership for gadgets."
      />
      <Queue />

      <div className="mt-4">
        <Card>
          <CardHead
            title={
              <>
                Access applications
                <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                  {items.length} pending
                </span>
              </>
            }
          />
          <CardBody flush>
            {apps.isLoading ? (
              <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
                Loading…
              </div>
            ) : apps.isError ? (
              <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
                Could not load applications.
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
                No pending applications.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] border-collapse">
                  <thead>
                    <tr>
                      {["ID", "User", "Category", "Reason", "Waited", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id} className="hover:bg-surface-2/40">
                        <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                          {a.id.slice(0, 8)}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 font-mono text-[12px] sm:px-[18px]">
                          {a.userId.slice(0, 8)}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CAT_BG[a.category]}`}
                          >
                            {a.category === "cars" ? "CAR" : "GADGET"}
                          </span>
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                          {a.reason}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-[13px] text-fg-muted sm:px-[18px]">
                          {timeAgo(a.createdAt)}
                        </td>
                        <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                setReviewing(a);
                                setNote("");
                              }}
                              className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-line-strong hover:bg-surface-2 hover:text-fg disabled:opacity-50"
                            >
                              Review
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => onApprove(a)}
                              className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {reviewing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setReviewing(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line-strong bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-[15px] font-semibold">
              Review · {reviewing.category === "cars" ? "Car" : "Gadget"} access
            </div>
            <p className="mb-3 text-[12px] text-fg-muted">{reviewing.reason}</p>
            <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-fg-dim">
              Review note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onReject(reviewing)}
                className="rounded-md border border-red/30 px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/10 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onApprove(reviewing)}
                className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-60"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
