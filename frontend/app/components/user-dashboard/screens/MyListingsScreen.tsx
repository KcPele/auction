"use client";
import Link from "next/link";
import { toast } from "sonner";
import { useMe } from "@/app/components/auth/hooks/use-me";
import {
  useMyListings,
  useSubmitListing,
} from "@/app/components/listings/hooks/use-listings";
import type {
  AnyListing,
  ListingStatusUi,
} from "@/app/components/listings/types/listing.types";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

const STATUS_STYLE: Record<ListingStatusUi, string> = {
  draft: "bg-surface-2 text-fg-muted",
  pending: "bg-accent/[0.12] text-accent",
  approved: "bg-green/[0.12] text-green",
  rejected: "bg-red/[0.12] text-red",
};

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
});

export function MyListingsScreen() {
  const { data, isLoading, isError, refetch } = useMyListings();
  const { data: me } = useMe();
  const submit = useSubmitListing();

  const onSubmit = async (l: AnyListing) => {
    try {
      await submit.mutateAsync({ id: l.id, category: l.category });
      toast.success("Submitted for review");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not submit");
    }
  };

  const listings = data ?? [];
  const permissions = me?.listingPermissions ?? [];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
          My listings
        </h1>
        <Link
          href="/dashboard/listings/create"
          className="inline-flex items-center gap-1.5 rounded-lg border-none px-3 py-2 text-xs font-bold text-[#1a0a00]"
          style={PRIMARY_BTN_BG}
        >
          <Icon name="plus" size={14} /> New listing
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-fg-dim">Could not load listings.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-xs text-accent"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            No listings yet. Create your first listing to get started.
          </div>
        ) : (
          listings.map((l) => (
            <div
              key={l.id}
              className="rounded-[14px] border border-line bg-surface p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      name={l.category === "cars" ? "car" : "phone"}
                      size={16}
                      className="text-fg-muted"
                    />
                    <span className="truncate text-[13px] font-semibold">
                      {l.title}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-fg-dim">
                    Updated {dateFmt.format(l.updatedAt)} · Base{" "}
                    {fmtNaira(l.basePrice)}
                  </div>
                  {l.status === "rejected" && l.reviewNote && (
                    <div className="mt-1.5 rounded border border-red/30 bg-red/[0.06] p-2 text-[11px] text-red">
                      Rejected: {l.reviewNote}
                    </div>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[l.status]}`}
                >
                  {l.status}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Link
                  href={`/dashboard/listings/${l.id}?category=${l.category}`}
                  className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:bg-surface-2"
                >
                  View
                </Link>
                {(l.status === "draft" || l.status === "rejected") && (
                  <Link
                    href={`/dashboard/listings/${l.id}/edit?category=${l.category}`}
                    className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:bg-surface-2"
                  >
                    {l.status === "rejected" ? "Edit & resubmit" : "Edit"}
                  </Link>
                )}
                {l.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => onSubmit(l)}
                    disabled={submit.isPending}
                    className="rounded-md border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-semibold text-accent disabled:opacity-60"
                  >
                    {submit.isPending ? "Submitting…" : "Submit for review"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <div className="text-[15px] font-semibold tracking-tight">
          Listing access
        </div>
        <div className="mt-2 rounded-[14px] border border-line bg-surface p-3.5">
          {(["CAR", "GADGET"] as const).map((cat, i) => {
            const has = permissions.some((p) => p.category === cat);
            return (
              <div
                key={cat}
                className={`flex items-center gap-3 ${i > 0 ? "mt-3 border-t border-line pt-3" : ""}`}
              >
                <Icon
                  name={cat === "CAR" ? "car" : "phone"}
                  size={18}
                  className="text-fg-muted"
                />
                <div className="flex-1">
                  <div className="text-[13px] font-medium">
                    {cat === "CAR" ? "Car" : "Gadget"} listing access
                  </div>
                  <div className="text-[11px] text-fg-dim">
                    {has
                      ? "Granted"
                      : "Not granted — apply via Listing access"}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    has
                      ? "bg-green/[0.12] text-green"
                      : "bg-surface-2 text-fg-dim"
                  }`}
                >
                  {has ? "Active" : "Inactive"}
                </span>
              </div>
            );
          })}
          {permissions.length === 0 && (
            <Link
              href="/dashboard/listing-access"
              className="mt-3 block rounded-lg border border-line bg-surface-2 p-2.5 text-center text-xs font-medium text-fg-muted"
            >
              Apply for listing access
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
