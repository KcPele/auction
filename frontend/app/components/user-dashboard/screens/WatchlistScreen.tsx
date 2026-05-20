"use client";
import Link from "next/link";
import { toast } from "sonner";
import {
  useRemoveFromWatchlist,
  useWatchlist,
} from "@/app/components/users/hooks/use-users";
import type { WatchlistItem } from "@/app/components/users/types/users.types";
import { ApiError } from "@/app/lib/api/error";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Icon } from "../primitives/Icon";

const STATUS_STYLE: Record<string, string> = {
  LIVE: "border-red/30 bg-red/[0.08] text-red",
  SCHEDULED: "border-accent/30 bg-accent/[0.08] text-accent",
  ENDED: "border-line bg-surface-2 text-fg-dim",
  AWAITING_PAYMENT: "border-line bg-surface-2 text-fg-dim",
  SETTLED: "border-line bg-surface-2 text-fg-dim",
  CANCELLED: "border-line bg-surface-2 text-fg-dim",
  DEFAULTED: "border-line bg-surface-2 text-fg-dim",
};

export function WatchlistScreen() {
  const { data, isLoading, isError, refetch } = useWatchlist();
  const remove = useRemoveFromWatchlist();
  const items = data ?? [];

  const onRemove = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Removed");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not remove");
    }
  };

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Watchlist
      </h1>
      <div className="mt-1 text-sm text-fg-muted">
        {items.length} saved auctions
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-fg-dim">Could not load.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-xs text-accent"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            No saved auctions. Browse and tap the heart icon to save.
          </div>
        ) : (
          items.map((w) => <Card key={w.id} w={w} onRemove={onRemove} />)
        )}
      </div>
    </>
  );
}

function Card({
  w,
  onRemove,
}: {
  w: WatchlistItem;
  onRemove: (auctionId: string) => void;
}) {
  const status = w.status ?? "ENDED";
  const ends = w.endTime ? timeAgo(w.endTime) : null;
  return (
    <div className="rounded-[14px] border border-line bg-surface p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-fg-muted">
          {w.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.photoUrl}
              alt={w.title}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Icon
              name={w.category === "cars" ? "car" : "phone"}
              size={22}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold">{w.title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLE[status] ?? ""}`}
            >
              {status === "LIVE"
                ? "Live"
                : status === "SCHEDULED"
                  ? "Soon"
                  : "Ended"}
            </span>
          </div>
          {ends && (
            <div className="mt-1 text-[11px] text-fg-dim">Ends {ends}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(w.auctionId)}
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
  );
}
