"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCarListing,
  useGadgetListing,
} from "@/app/components/listings/hooks/use-listings";
import type {
  CarListing,
  GadgetListing,
} from "@/app/components/listings/types/listing.types";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type Category = "car" | "gadget";

const STATUS_STYLE = {
  approved: "bg-green/[0.12] text-green",
  pending: "bg-accent/[0.12] text-accent",
  rejected: "bg-red/[0.12] text-red",
  draft: "bg-surface-2 text-fg-muted",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function ListingDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const category = (params.get("category") ?? "car") as Category;

  const car = useCarListing(category === "car" ? id : undefined);
  const gadget = useGadgetListing(category === "gadget" ? id : undefined);

  const query = category === "car" ? car : gadget;
  const listing = (category === "car" ? car.data : gadget.data) ?? null;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/listings")}
          className="inline-flex items-center gap-1.5 text-fg-muted"
        >
          <Icon name="chevron-l" size={14} /> Back
        </button>
      </div>

      {query.isLoading ? (
        <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
      ) : query.isError || !listing ? (
        <div className="py-10 text-center">
          <p className="text-sm text-fg-dim">Could not load listing.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-2 text-xs text-accent"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="m-0 font-display text-[26px] font-semibold leading-tight tracking-tight">
                {listing.title}
              </h1>
              <div className="mt-1 text-[13px] text-fg-muted">
                {category === "car" ? "Car" : "Gadget"} listing · ID{" "}
                <span className="font-mono text-[11px]">{id.slice(0, 8)}</span>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[listing.status]}`}
            >
              {listing.status}
            </span>
          </div>

          {listing.reviewNote && (
            <div className="mt-3 rounded-lg border border-red/30 bg-red/[0.06] p-3 text-[12px] text-red">
              <strong>Review note:</strong> {listing.reviewNote}
            </div>
          )}

          {listing.photoUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {listing.photoUrls.slice(0, 6).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  alt=""
                  className="aspect-square w-full rounded-lg border border-line object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-[14px] border border-line bg-surface">
            {fieldsFor(listing).map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <div className="w-40 flex-shrink-0 text-[11px] uppercase tracking-[0.08em] text-fg-dim">
                  {f.label}
                </div>
                <div className="text-[13px] text-fg">{f.value}</div>
              </div>
            ))}
          </div>

          {(listing.status === "draft" || listing.status === "rejected") && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/listings/${id}/edit?category=${category}`}
                className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-fg hover:bg-surface-2"
              >
                Edit
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}

function fieldsFor(l: CarListing | GadgetListing) {
  const common = [
    { label: "Base price", value: fmtNaira(l.basePrice) },
    { label: "Hold", value: `${l.holdPercent}%` },
    { label: "Bid increment", value: fmtNaira(l.minimumBidIncrement) },
    { label: "Starts", value: dateFmt.format(l.startTime) },
    { label: "Duration", value: `${l.durationMinutes} minutes` },
  ];
  if (l.category === "cars") {
    return [
      { label: "Make", value: l.make },
      { label: "Model", value: l.model },
      { label: "Year", value: String(l.year) },
      { label: "Colour", value: l.colour },
      { label: "Registration", value: l.registrationNumber },
      { label: "Mileage", value: `${l.mileage.toLocaleString()} km` },
      { label: "Condition", value: l.condition },
      { label: "Known faults", value: l.knownFaults || "—" },
      ...common,
    ];
  }
  return [
    { label: "Type", value: l.type },
    { label: "Brand", value: l.brand },
    { label: "Model", value: l.model },
    { label: "Colour", value: l.colour },
    {
      label: "Battery",
      value:
        l.batteryHealthPercent !== null ? `${l.batteryHealthPercent}%` : "—",
    },
    {
      label: "Specs",
      value: l.specs
        ? Object.entries(l.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")
        : "—",
    },
    { label: "Usage history", value: l.usageHistory },
    { label: "Defects", value: l.defects || "—" },
    ...common,
  ];
}
