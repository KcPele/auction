"use client";
import { useState } from "react";
import { Icon } from "../primitives/Icon";
import type { ListingAccessApplication, Category } from "../types";

const MOCK_APPLICATIONS: ListingAccessApplication[] = [
  {
    id: "la-1",
    status: "PENDING",
    category: "cars",
    appliedAt: "2026-05-01T10:00:00Z",
    reason: "Registered car dealer with 5+ years experience",
  },
  {
    id: "la-2",
    status: "APPROVED",
    category: "gadgets",
    appliedAt: "2026-04-20T08:00:00Z",
    reviewedAt: "2026-04-21T14:00:00Z",
  },
  {
    id: "la-3",
    status: "REJECTED",
    category: "cars",
    appliedAt: "2026-04-10T12:00:00Z",
    reviewedAt: "2026-04-11T09:00:00Z",
    reason: "Incomplete business documentation",
  },
];

function statusStyle(status: ListingAccessApplication["status"]) {
  const map = {
    PENDING: "border-amber/30 bg-amber/10 text-amber",
    APPROVED: "border-green/30 bg-green/10 text-green",
    REJECTED: "border-red/30 bg-red/10 text-red",
  };
  return map[status];
}

export function ListingAccessScreen() {
  // Integration: GET /api/v1/users/me/listing-access-applications
  const [applications] = useState<ListingAccessApplication[]>(MOCK_APPLICATIONS);
  const [showApply, setShowApply] = useState(false);
  const [applyCategory, setApplyCategory] = useState<Category>("cars");
  const [applyReason, setApplyReason] = useState("");

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">Listing access</h1>
        <button
          type="button"
          onClick={() => setShowApply(true)}
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
              <label className="mb-1 block text-xs font-medium text-fg-muted">Category</label>
              <div className="flex gap-2">
                {(["cars", "gadgets"] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setApplyCategory(cat)}
                    className={`flex-1 rounded-lg border p-2.5 text-sm font-medium capitalize ${
                      applyCategory === cat ? "border-accent bg-accent/10 text-accent" : "border-line text-fg"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">Why do you want to list?</label>
              <textarea
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                placeholder="Brief reason or qualification..."
                className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
                rows={3}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                // Integration: POST /api/v1/users/me/listing-access-applications { category, reason }
                setShowApply(false);
              }}
              className="rounded-lg border-none p-2.5 text-sm font-bold text-[#1a0a00] accent-gradient-bg"
            >
              Submit application
            </button>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="mt-12 text-center text-sm text-fg-muted">
          <Icon name="tag" size={40} className="mx-auto mb-3 text-fg-dim" />
          <p>No listing applications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <div key={app.id} className="rounded-[14px] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold capitalize">{app.category}</div>
                  <div className="mt-0.5 text-xs text-fg-dim">
                    Applied {new Date(app.appliedAt).toLocaleDateString("en-NG")}
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle(app.status)}`}>
                  {app.status}
                </span>
              </div>
              {app.reason && (
                <div className="mt-2 text-xs text-fg-muted">{app.reason}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
