"use client";
import { fmtNaira } from "@/app/components/user-dashboard/utils";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import type { Bid } from "../types/auction.types";

interface Props {
  bids: Bid[];
  currentUserId?: string;
  isLoading?: boolean;
}

export function BidHistoryList({ bids, currentUserId, isLoading }: Props) {
  if (isLoading && bids.length === 0) {
    return (
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-line py-3 last:border-b-0">
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    );
  }
  if (bids.length === 0) {
    return (
      <div className="rounded-[14px] border border-line bg-surface p-6 text-center text-sm text-fg-dim">
        No bids yet — be the first.
      </div>
    );
  }
  return (
    <div className="rounded-[14px] border border-line bg-surface p-3.5">
      {bids.map((b) => {
        const me = b.userId === currentUserId;
        return (
          <div
            key={b.id}
            className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line py-3 last:border-b-0"
          >
            <div>
              <div
                className={`text-[13px] font-medium ${me ? "text-accent-light" : "text-fg"}`}
              >
                {b.handle}
                {me && <span className="ml-1 text-[10px] text-fg-dim">· you</span>}
              </div>
              <div className="text-[11px] text-fg-dim">{timeAgo(b.placedAt)}</div>
            </div>
            <div className="mr-2.5 text-right font-mono text-[13px] font-semibold tabular-nums">
              {fmtNaira(b.amount)}
            </div>
            {b.isLeading && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-green">
                top
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
