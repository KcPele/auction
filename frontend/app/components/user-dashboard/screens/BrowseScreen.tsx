"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export function BrowseScreen() {
  const params = useSearchParams();
  const initialCat = (params.get("cat") as CatFilter) || "all";
  const [cat, setCat] = useState<CatFilter>(initialCat);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setCat(initialCat);
  }, [initialCat]);

  const filtered = useMemo(() => {
    let list = AUCTIONS;
    if (cat !== "all") list = list.filter((a) => a.cat === cat);
    if (status === "live") list = list.filter((a) => a.live);
    if (status === "soon") list = list.filter((a) => !a.live);
    if (query) list = list.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [cat, status, query]);

  return (
    <>
      <h1 className="dash-page-title">Browse</h1>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
        }}
      >
        <Icon name="search" size={18} style={{ color: "var(--fg-muted)" }} />
        <input
          placeholder="Search Camry, iPhone, Lexus…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--fg)",
            fontSize: 14,
          }}
        />
        <button type="button" style={{ color: "var(--fg-muted)", background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="sliders" size={18} />
        </button>
      </div>

      <div className="dash-chips" style={{ marginTop: 14 }}>
        {CAT_OPTS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`dash-chip ${cat === c.id ? "active" : ""}`}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        {STATUS_OPTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`dash-chip ${status === s.id ? "active" : ""}`}
            onClick={() => setStatus(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/auction/${a.id}`}
            className="dash-tile"
            style={{ width: "auto" }}
          >
            <div className="dash-tile-media" style={{ aspectRatio: "1/1" }}>
              <Icon name={a.cat === "cars" ? "car" : "phone"} size={36} />
              <span className={`dash-tile-badge ${a.live ? "live" : "starting"}`}>
                {a.live ? (
                  <>
                    <span className="dash-live-dot" /> Live
                  </>
                ) : (
                  "Soon"
                )}
              </span>
            </div>
            <div className="dash-tile-info" style={{ padding: 10 }}>
              <div className="dash-tile-title" style={{ fontSize: 12 }}>
                {a.title}
              </div>
              <div className="dash-tile-bid-val" style={{ fontSize: 13 }}>
                {fmtNaira(a.live ? a.current : a.start)}
              </div>
              <div className="dash-tile-meta">
                {a.bids} bids · <Countdown endsIn={a.endsIn} compact />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--fg-dim)" }}>
            No auctions match those filters
          </div>
        )}
      </div>
    </>
  );
}
