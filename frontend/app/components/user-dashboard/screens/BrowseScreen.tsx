"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuctions } from "@/app/components/auctions/hooks/use-auctions";
import type {
  Auction,
  AuctionCategory,
} from "@/app/components/auctions/types/auction.types";
import { Icon } from "../primitives/Icon";
import { Countdown } from "../widgets/Countdown";
import { FilterPanel, type BrowseFilters } from "../widgets/FilterPanel";
import { fmtNaira } from "../utils";
import { nairaToKobo } from "@/app/lib/format/money";
import { useDebounced } from "@/app/components/search/hooks/use-search";

type CatFilter = "all" | AuctionCategory;
type StatusFilter = "all" | "live" | "soon";

const CAT_OPTS: Array<{ id: CatFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "cars", label: "Cars" },
  { id: "gadgets", label: "Gadgets" },
];
const STATUS_OPTS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Any status" },
  { id: "live", label: "Live now" },
  { id: "soon", label: "Opening soon" },
];

function chipClass(active: boolean) {
  return `flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium ${
    active
      ? "border border-line-strong bg-accent/[0.12] text-accent"
      : "border border-line bg-surface text-fg-muted"
  }`;
}

export function BrowseScreen() {
  const params = useSearchParams();
  const initialCat = (params.get("cat") as CatFilter) || "all";
  const [selectedCat, setSelectedCat] = useState<CatFilter | null>(null);
  const cat = selectedCat ?? initialCat;
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query.trim(), 250);
  const [filters, setFilters] = useState<BrowseFilters>({});
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, refetch } = useAuctions({
    category: cat === "all" ? undefined : cat,
    status:
      status === "live" ? "LIVE" : status === "soon" ? "SCHEDULED" : undefined,
    search: debouncedQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
    minPriceKobo:
      filters.minPrice != null ? nairaToKobo(filters.minPrice) : undefined,
    maxPriceKobo:
      filters.maxPrice != null ? nairaToKobo(filters.maxPrice) : undefined,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
  });

  const filterCount =
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.minYear != null ? 1 : 0) +
    (filters.maxYear != null ? 1 : 0);

  const auctions = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const pageStart = total === 0 ? 0 : page * pageSize + 1;
  const pageEnd = Math.min((page + 1) * pageSize, total);

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Browse
      </h1>

      <div className="relative mt-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <Icon name="search" size={18} className="text-fg-muted" />
          <input
            placeholder="Search Camry, iPhone, Lexus…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="flex-1 border-none bg-transparent text-sm text-fg outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!filterOpen) setDraftFilters(filters);
              setFilterOpen((v) => !v);
            }}
            className={`relative cursor-pointer border-none bg-transparent ${
              filterCount > 0 ? "text-accent" : "text-fg-muted"
            }`}
            aria-label="Open filters"
          >
            <Icon name="sliders" size={18} />
            {filterCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            )}
          </button>
        </div>
        <FilterPanel
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          value={draftFilters}
          onChange={setDraftFilters}
          onApply={(next) => {
            setFilters(next);
            setPage(0);
            setFilterOpen(false);
          }}
          showYearFields={cat !== "gadgets"}
        />
      </div>

      <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {CAT_OPTS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chipClass(cat === c.id)}
            onClick={() => {
              setSelectedCat(c.id);
              setPage(0);
            }}
            aria-pressed={cat === c.id}
          >
            {c.label}
          </button>
        ))}
        <div className="mx-1 w-px bg-line" />
        {STATUS_OPTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={chipClass(status === s.id)}
            onClick={() => {
              setStatus(s.id);
              setPage(0);
            }}
            aria-pressed={status === s.id}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {isLoading && !data ? (
          Array.from({ length: 6 }).map((_, i) => <TileSkeleton key={i} />)
        ) : isError ? (
          <div className="col-span-full py-10 text-center text-sm text-fg-dim">
            Could not load auctions.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-accent hover:text-accent-2"
            >
              Retry
            </button>
          </div>
        ) : auctions.length === 0 ? (
          <div className="col-span-full py-10 text-center text-fg-dim">
            No auctions match those filters
          </div>
        ) : (
          auctions.map((a) => <AuctionTile key={a.id} a={a} />)
        )}
      </div>

      {total > pageSize && (
        <nav
          aria-label="Auction results pages"
          className="mt-5 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={page === 0 || isLoading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-fg-muted disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-fg-muted">
            {pageStart}–{pageEnd} of {total}
          </span>
          <button
            type="button"
            disabled={pageEnd >= total || isLoading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-fg-muted disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      )}
    </>
  );
}

function AuctionTile({ a }: { a: Auction }) {
  return (
    <Link
      href={`/dashboard/auction/${a.id}`}
      className="block cursor-pointer overflow-hidden rounded-[14px] border border-line bg-surface text-left text-fg"
    >
      <div className="relative flex aspect-square items-center justify-center bg-media-background text-media-foreground">
        {a.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.photoUrl}
            alt={a.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon name={a.category === "cars" ? "car" : "phone"} size={36} />
        )}
        <span
          className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[5px] border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
            a.isLive
              ? "border-red/30 bg-red/15 text-red"
              : "border-accent/30 bg-accent/15 text-accent"
          }`}
        >
          {a.isLive ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" />{" "}
              Live
            </>
          ) : a.isUpcoming ? (
            "Soon"
          ) : (
            "Ended"
          )}
        </span>
      </div>
      <div className="p-2.5">
        <div className="mb-[3px] truncate text-[12px] font-semibold">
          {a.title}
        </div>
        <div className="font-mono text-[13px] font-semibold tabular-nums text-accent-light">
          {fmtNaira(a.isLive ? a.currentBid : a.basePrice)}
        </div>
        <div className="text-[11px] text-fg-dim">
          <Countdown target={a.endTime.getTime()} compact />
        </div>
      </div>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="aspect-square animate-pulse bg-surface-2" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
