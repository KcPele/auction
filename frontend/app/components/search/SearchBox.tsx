"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/user-dashboard/primitives/Icon";
import { useSearchAuctions } from "./hooks/use-search";

interface Props {
  /** Where to send the user when they click a result. */
  resultHrefPrefix?: string;
}

/**
 * Reusable search box used by the user TopBar and the admin TopBar. Lives in
 * its own feature folder per the project pattern (folder per feature).
 */
export function SearchBox({ resultHrefPrefix = "/dashboard/auction" }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data = [], isFetching } = useSearchAuctions(q);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        wrapRef.current?.querySelector("input")?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex max-w-[480px] flex-1 flex-col"
    >
      <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-[9px]">
        <Icon name="search" size={16} style={{ color: "var(--fg-muted)" }} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search auctions by make, model, brand…"
          className="flex-1 border-none bg-transparent text-[13px] text-fg outline-none"
        />
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-dim">
          ⌘K
        </span>
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[360px] overflow-y-auto rounded-[10px] border border-line bg-bg shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {isFetching && data.length === 0 ? (
            <div className="px-4 py-3 text-xs text-fg-dim">Searching…</div>
          ) : data.length === 0 ? (
            <div className="px-4 py-3 text-xs text-fg-dim">No matches.</div>
          ) : (
            data.map((hit) => (
              <button
                key={hit.auctionId}
                type="button"
                onClick={() => {
                  router.push(`${resultHrefPrefix}/${hit.auctionId}`);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 border-b border-line/60 px-3 py-2 text-left hover:bg-surface"
              >
                {hit.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hit.coverUrl}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-surface-2 text-fg-dim">
                    <Icon name={hit.category === "car" ? "car" : "phone"} size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">
                    {hit.title}
                  </div>
                  <div className="truncate text-[11px] text-fg-dim">
                    {hit.subtitle || hit.category} · {hit.status}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
