"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "../primitives/Icon";

interface WatchlistItem {
  id: string;
  auctionId: string;
  title: string;
  category: "CAR" | "GADGET";
  status: "LIVE" | "SCHEDULED" | "ENDED";
  photo?: string;
  currentBid?: number;
  endsIn?: string;
}

const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: "W-1", auctionId: "a-4390", title: "2019 Toyota Camry XLE", category: "CAR", status: "LIVE", currentBid: 12_800_000, endsIn: "2h 14m" },
  { id: "W-2", auctionId: "a-4391", title: "iPhone 15 Pro Max 256GB", category: "GADGET", status: "LIVE", currentBid: 950_000, endsIn: "45m" },
  { id: "W-3", auctionId: "a-4400", title: "2020 Honda Accord Sport", category: "CAR", status: "SCHEDULED", endsIn: "Opens in 3d" },
  { id: "W-4", auctionId: "a-4380", title: "MacBook Pro 14\" M3", category: "GADGET", status: "ENDED", currentBid: 2_100_000 },
];

const STATUS_STYLE: Record<string, string> = {
  LIVE: "border-red/30 bg-red/[0.08] text-red",
  SCHEDULED: "border-accent/30 bg-accent/[0.08] text-accent",
  ENDED: "border-line bg-surface-2 text-fg-dim",
};

export function WatchlistScreen() {
  // Integration: fetch from GET /api/v1/users/me/watchlist
  const [items, setItems] = useState<WatchlistItem[]>(MOCK_WATCHLIST);

  const remove = (id: string) => {
    // Integration: DELETE /api/v1/users/me/watchlist/{auctionId}
    setItems((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Watchlist</h1>
      <div className="mt-1 text-sm text-fg-muted">{items.length} saved auctions</div>

      <div className="mt-4 flex flex-col gap-2.5">
        {items.map((w) => (
          <div
            key={w.id}
            className="rounded-[14px] border border-line bg-surface p-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-fg-muted">
                <Icon name={w.category === "CAR" ? "car" : "phone"} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{w.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLE[w.status]}`}>
                    {w.status === "LIVE" ? "Live" : w.status === "SCHEDULED" ? "Soon" : "Ended"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-fg-dim">
                  {w.currentBid && `₦${w.currentBid.toLocaleString()}`}
                  {w.currentBid && w.endsIn && " · "}
                  {w.endsIn}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(w.id)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-fg-dim hover:bg-red/[0.08] hover:text-red"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="mt-2.5">
              <Link
                href={`/dashboard/auction/${w.auctionId}`}
                className="rounded-md border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-semibold text-accent"
              >
                View auction
              </Link>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-10 text-center text-sm text-fg-dim">
            No saved auctions. Browse auctions and tap the heart icon to save.
          </div>
        )}
      </div>
    </>
  );
}
