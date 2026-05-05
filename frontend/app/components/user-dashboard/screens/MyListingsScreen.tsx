"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "../primitives/Icon";

type ListingStatus = "draft" | "pending" | "approved" | "rejected";

interface MyListing {
  id: string;
  title: string;
  category: "CAR" | "GADGET";
  status: ListingStatus;
  basePrice: number;
  createdAt: string;
}

const MOCK_LISTINGS: MyListing[] = [
  { id: "L-001", title: "2018 Toyota Camry SE", category: "CAR", status: "approved", basePrice: 8_500_000, createdAt: "10 Apr" },
  { id: "L-002", title: "iPhone 15 Pro Max 256GB", category: "GADGET", status: "pending", basePrice: 950_000, createdAt: "18 Apr" },
  { id: "L-003", title: "2016 Honda Accord EX-L", category: "CAR", status: "draft", basePrice: 6_200_000, createdAt: "20 Apr" },
  { id: "L-004", title: 'MacBook Pro 14" M3', category: "GADGET", status: "rejected", basePrice: 2_100_000, createdAt: "15 Apr" },
];

const STATUS_STYLE: Record<ListingStatus, string> = {
  draft: "bg-surface-2 text-fg-muted",
  pending: "bg-accent/[0.12] text-accent",
  approved: "bg-green/[0.12] text-green",
  rejected: "bg-red/[0.12] text-red",
};

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function MyListingsScreen() {
  // Integration: fetch from GET /api/v1/cars/my-listings and GET /api/v1/gadgets/my-listings
  const [listings] = useState<MyListing[]>(MOCK_LISTINGS);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">My listings</h1>
        <Link
          href="/dashboard/listings/create"
          className="inline-flex items-center gap-1.5 rounded-lg border-none px-3 py-2 text-xs font-bold text-[#1a0a00]"
          style={PRIMARY_BTN_BG}
        >
          <Icon name="plus" size={14} /> New listing
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {listings.map((l) => (
          <div
            key={l.id}
            className="rounded-[14px] border border-line bg-surface p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon name={l.category === "CAR" ? "car" : "phone"} size={16} className="text-fg-muted" />
                  <span className="text-[13px] font-semibold">{l.title}</span>
                </div>
                <div className="mt-1 text-[11px] text-fg-dim">
                  Created {l.createdAt} · Base price ₦{l.basePrice.toLocaleString()}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[l.status]}`}>
                {l.status}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Link
                href={`/dashboard/listings/${l.id}?category=${l.category.toLowerCase()}`}
                className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:bg-surface-2"
              >
                View
              </Link>
              {(l.status === "draft" || l.status === "rejected") && (
                <Link
                  href={`/dashboard/listings/${l.id}/edit?category=${l.category.toLowerCase()}`}
                  className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:bg-surface-2"
                >
                  {l.status === "rejected" ? "Edit & resubmit" : "Edit"}
                </Link>
              )}
              {l.status === "draft" && (
                <button
                  type="button"
                  onClick={() => {
                    // Integration: POST /api/v1/cars/{id}/submit or POST /api/v1/gadgets/{id}/submit
                    alert(`Submit ${l.title} for review`);
                  }}
                  className="rounded-md border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-semibold text-accent"
                >
                  Submit for review
                </button>
              )}
              {l.status === "approved" && (
                <Link
                  href={`/dashboard/auction/${l.id}`}
                  className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green"
                >
                  View live
                </Link>
              )}
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div className="py-10 text-center text-sm text-fg-dim">
            No listings yet. Create your first listing to get started.
          </div>
        )}
      </div>

      {/* Listing applications status */}
      <div className="mt-6">
        <div className="text-[15px] font-semibold tracking-tight">Listing access</div>
        <div className="mt-2 rounded-[14px] border border-line bg-surface p-3.5">
          <div className="flex items-center gap-3">
            <Icon name="car" size={18} className="text-fg-muted" />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Car listing access</div>
              <div className="text-[11px] text-fg-dim">Approved · 5 Apr 2026</div>
            </div>
            <span className="rounded-full bg-green/[0.12] px-2 py-0.5 text-[10px] font-semibold text-green">Active</span>
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
            <Icon name="phone" size={18} className="text-fg-muted" />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Gadget listing access</div>
              <div className="text-[11px] text-fg-dim">Pending review · applied 18 Apr</div>
            </div>
            <span className="rounded-full bg-accent/[0.12] px-2 py-0.5 text-[10px] font-semibold text-accent">Pending</span>
          </div>
        </div>
      </div>
    </>
  );
}
