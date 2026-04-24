import { Placeholder } from "./Placeholder";
import { LiveDot } from "./primitives/LiveDot";
import type { Auction } from "./types";
import { fmtNaira, formatAuctionTime } from "./utils";

interface AuctionCardProps {
  auction: Auction;
  endSec: number;
}

const STATUS_LABEL: Record<Auction["status"], string> = {
  live: "LIVE",
  starting: "STARTING",
  scheduled: "SCHEDULED",
};

const STATUS_CLS: Record<Auction["status"], string> = {
  live: "bg-[rgba(239,74,58,0.15)] text-red border border-[rgba(239,74,58,0.3)]",
  starting: "bg-[rgba(232,183,85,0.15)] text-gold border border-[rgba(232,183,85,0.3)]",
  scheduled: "bg-white/5 text-fg-muted border border-line",
};

export function AuctionCard({ auction, endSec }: AuctionCardProps) {
  const holdAmount = Math.round((auction.bid * 0.1) / 1000) * 1000;
  return (
    <div className="cursor-pointer rounded-lg border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-line-strong">
      <div className="relative mb-3.5 aspect-[4/3] overflow-hidden rounded-md">
        <Placeholder aspect="4/3" kind={auction.kind} tag={auction.tag} />
        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xs px-2.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.1em] ${STATUS_CLS[auction.status]}`}
        >
          {auction.status === "live" && <LiveDot />}
          {STATUS_LABEL[auction.status]}
        </div>
        <div className="absolute bottom-3 right-3 rounded-xs border border-line bg-black/70 px-2.5 py-1.5 font-mono text-xs tabular-nums text-fg backdrop-blur-md">
          {formatAuctionTime(endSec)}
        </div>
      </div>
      <h3 className="m-0 mb-1 font-display text-lg font-semibold tracking-[-0.01em]">{auction.title}</h3>
      <div className="mb-3 text-xs text-fg-muted">{auction.meta}</div>
      <div className="flex items-end justify-between border-t border-line pt-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-fg-dim">Current bid</div>
          <div className="font-mono text-lg font-semibold tabular-nums text-accent-2">{fmtNaira(auction.bid)}</div>
        </div>
        <div className="text-right text-[11px] text-fg-muted">
          {auction.bidders} bidders
          <br />
          <span className="text-[10px] text-fg-dim">{fmtNaira(holdAmount)} hold</span>
        </div>
      </div>
    </div>
  );
}
