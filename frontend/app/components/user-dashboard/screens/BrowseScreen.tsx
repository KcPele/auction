"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "../primitives/Icon";
import { Countdown } from "../widgets/Countdown";
import { AUCTIONS } from "../data";
import { fmtNaira } from "../utils";
import type { Category } from "../types";

type CatFilter = "all" | Category;
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

const TILE_MEDIA_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 10px, rgba(255,170,90,0.07) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
};

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

  const filtered = useMemo(() => {
    // Integration: replace with GET /api/v1/auctions?category=CAR|GADGET&status=LIVE|SCHEDULED&limit=20&offset=0
    // cat: "cars" -> category=CAR, "gadgets" -> category=GADGET
    // status: "live" -> status=LIVE, "soon" -> status=SCHEDULED
    let list = AUCTIONS;
    if (cat !== "all") list = list.filter((a) => a.cat === cat);
    if (status === "live") list = list.filter((a) => a.live);
    if (status === "soon") list = list.filter((a) => !a.live);
    if (query) list = list.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [cat, status, query]);

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Browse</h1>

      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
        <Icon name="search" size={18} className="text-fg-muted" />
        <input
          placeholder="Search Camry, iPhone, Lexus…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-none bg-transparent text-sm text-fg outline-none"
        />
        <button type="button" className="cursor-pointer border-none bg-transparent text-fg-muted">
          <Icon name="sliders" size={18} />
        </button>
      </div>

      <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {CAT_OPTS.map((c) => (
          <button key={c.id} type="button" className={chipClass(cat === c.id)} onClick={() => setSelectedCat(c.id)}>
            {c.label}
          </button>
        ))}
        <div className="mx-1 w-px bg-line" />
        {STATUS_OPTS.map((s) => (
          <button key={s.id} type="button" className={chipClass(status === s.id)} onClick={() => setStatus(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/auction/${a.id}`}
            className="block cursor-pointer overflow-hidden rounded-[14px] border border-line bg-surface text-left text-fg"
          >
            <div
              className="relative flex aspect-square items-center justify-center text-[rgba(255,200,140,0.3)]"
              style={TILE_MEDIA_BG}
            >
              <Icon name={a.cat === "cars" ? "car" : "phone"} size={36} />
              <span
                className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[5px] border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
                  a.live
                    ? "border-red/30 bg-red/15 text-red"
                    : "border-accent/30 bg-accent/15 text-accent"
                }`}
              >
                {a.live ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" /> Live
                  </>
                ) : (
                  "Soon"
                )}
              </span>
            </div>
            <div className="p-2.5">
              <div className="mb-[3px] truncate text-[12px] font-semibold">{a.title}</div>
              <div className="font-mono text-[13px] font-semibold tabular-nums text-accent-light">
                {fmtNaira(a.live ? a.current : a.start)}
              </div>
              <div className="text-[11px] text-fg-dim">
                {a.bids} bids · <Countdown endsIn={a.endsIn} compact />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-fg-dim">
            No auctions match those filters
          </div>
        )}
      </div>
    </>
  );
}
