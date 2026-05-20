"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApproveListing,
  usePendingListings,
  useRejectListing,
} from "@/app/components/admin/hooks/use-admin-listings";
import type { AdminPendingListing } from "@/app/components/admin/types/listings.types";
import { ApiError } from "@/app/lib/api/error";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { AdminIcon } from "../primitives/Icon";
import { Card, CardBody, CardHead } from "./Card";
import { ListingReviewDialog } from "./ListingReviewDialog";

const KIND_TAG: Record<"cars" | "gadgets", string> = {
  cars: "text-accent-2 bg-accent-2/[0.06] border-accent-2/20",
  gadgets: "text-[#a2c9ff] bg-[#a2c9ff]/[0.06] border-[#a2c9ff]/20",
};

const ROW_THUMB_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.08) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
};

export function Queue() {
  const { data, isLoading, isError, refetch } = usePendingListings();
  const approve = useApproveListing();
  const reject = useRejectListing();
  const [reviewing, setReviewing] = useState<AdminPendingListing | null>(null);

  const items = data ?? [];
  const isPending = approve.isPending || reject.isPending;

  const onApprove = async (input: {
    listing: AdminPendingListing;
    reviewNote?: string;
  }) => {
    try {
      await approve.mutateAsync({
        id: input.listing.id,
        category: input.listing.category,
        reviewNote: input.reviewNote,
      });
      toast.success("Listing approved");
      setReviewing(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not approve");
    }
  };

  const onReject = async (input: {
    listing: AdminPendingListing;
    reviewNote?: string;
  }) => {
    try {
      await reject.mutateAsync({
        id: input.listing.id,
        category: input.listing.category,
        reviewNote: input.reviewNote,
      });
      toast.success("Listing rejected");
      setReviewing(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not reject");
    }
  };

  return (
    <>
      <Card>
        <CardHead
          title={
            <>
              Listing approvals
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {items.length} waiting
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
              Could not load queue.{" "}
              <button onClick={() => refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Queue clear. Nothing awaiting review.
            </div>
          ) : (
            items.map((q) => (
              <div
                key={q.id}
                className="flex flex-col gap-3 overflow-hidden border-b border-line px-3.5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:px-[18px]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line text-[rgba(255,200,140,0.4)]"
                    style={ROW_THUMB_BG}
                  >
                    {q.photoUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={q.photoUrls[0]}
                        alt={q.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AdminIcon
                        name={q.category === "cars" ? "car" : "phone"}
                        size={22}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TAG[q.category]}`}
                      >
                        {q.category === "cars" ? "car" : "gadget"}
                      </span>
                      <span className="font-mono text-[11px] text-fg-dim">
                        waited {timeAgo(q.createdAt)}
                      </span>
                    </div>
                    <div className="truncate text-[13px] font-medium">
                      {q.title}
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-1.5 sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setReviewing(q)}
                    className="flex-1 rounded-[5px] border border-line bg-transparent px-2.5 py-1 text-[11px] font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg sm:flex-initial"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onApprove({ listing: q })}
                    className="flex-1 rounded-[5px] border border-green/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/10 disabled:opacity-60 sm:flex-initial"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onReject({ listing: q })}
                    className="flex-1 rounded-[5px] border border-red/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10 disabled:opacity-60 sm:flex-initial"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <ListingReviewDialog
        listing={reviewing}
        onClose={() => setReviewing(null)}
        onApprove={onApprove}
        onReject={onReject}
        isPending={isPending}
      />
    </>
  );
}
