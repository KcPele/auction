"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApplications,
  useApplyForListingAccess,
} from "@/app/components/users/hooks/use-users";
import type { ListingAccessApplication } from "@/app/components/users/types/users.types";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";

type Category = "cars" | "gadgets";

function statusStyle(status: ListingAccessApplication["status"]) {
  const map = {
    PENDING: "border-amber/30 bg-amber/10 text-amber",
    APPROVED: "border-green/30 bg-green/10 text-green",
    REJECTED: "border-red/30 bg-red/10 text-red",
  } as const;
  return map[status];
}

export function ListingAccessScreen() {
  const { data, isLoading, isError, refetch } = useApplications();
  const apply = useApplyForListingAccess();

  const [showApply, setShowApply] = useState(false);
  const [category, setCategory] = useState<Category>("cars");
  const [reason, setReason] = useState("");

  const onSubmit = async () => {
    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    try {
      await apply.mutateAsync({ category, reason: reason.trim() });
      toast.success("Application submitted");
      setShowApply(false);
      setReason("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not submit application");
    }
  };

  const apps = data ?? [];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">
          Listing access
        </h1>
        <button
          type="button"
          onClick={() => setShowApply((v) => !v)}
          className="rounded-lg border-none px-3 py-2 text-xs font-bold text-[#1a0a00] accent-gradient-bg"
        >
          + Apply
        </button>
      </div>

      {showApply && (
        <div className="mb-4 rounded-[14px] border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[15px] font-semibold">Apply for listing access</div>
            <button
              type="button"
              onClick={() => setShowApply(false)}
              className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-2"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Category
              </label>
              <div className="flex gap-2">
                {(["cars", "gadgets"] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 rounded-lg border p-2.5 text-sm font-medium capitalize ${
                      category === cat
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line text-fg"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">
                Why do you want to list? (min 10 chars)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason or qualification…"
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
                rows={3}
              />
            </div>
            <button
              type="button"
              disabled={apply.isPending}
              onClick={onSubmit}
              className="rounded-lg border-none p-2.5 text-sm font-bold text-[#1a0a00] accent-gradient-bg disabled:opacity-60"
            >
              {apply.isPending ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
      ) : isError ? (
        <div className="py-10 text-center">
          <p className="text-sm text-fg-dim">Could not load applications.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs text-accent"
          >
            Retry
          </button>
        </div>
      ) : apps.length === 0 ? (
        <div className="mt-12 text-center text-sm text-fg-muted">
          <Icon name="tag" size={40} className="mx-auto mb-3 text-fg-dim" />
          <p>No listing applications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold capitalize">
                    {app.category}
                  </div>
                  <div className="mt-0.5 text-xs text-fg-dim">
                    Applied{" "}
                    {app.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle(app.status)}`}
                >
                  {app.status}
                </span>
              </div>
              {app.reason && (
                <div className="mt-2 text-xs text-fg-muted">{app.reason}</div>
              )}
              {app.reviewNote && (
                <div className="mt-2 rounded border border-line-strong bg-surface-2 p-2 text-xs">
                  <span className="font-medium">Review:</span> {app.reviewNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
