"use client";
import { useTickerFeed } from "./hooks/useTickerFeed";
import { fmtNaira } from "./utils";
import { LiveDot } from "./primitives/LiveDot";

export function Ticker() {
  const feed = useTickerFeed();
  if (feed.length === 0) return null;
  const row = [...feed, ...feed];
  return (
    <div className="relative flex items-center gap-4 overflow-hidden border-y border-line bg-[linear-gradient(90deg,rgba(255,122,26,0.12),transparent_30%)] py-3 pl-6">
      <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line-strong bg-[rgba(255,122,26,0.06)] px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-accent">
        <LiveDot />
        LIVE BIDS
      </div>
      <div
        className="flex-1 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        }}
      >
        <div className="flex gap-12 whitespace-nowrap animate-[tickerScroll_55s_linear_infinite]">
          {row.map((b, i) => (
            <div className="inline-flex items-center gap-2.5 text-[13px]" key={i}>
              <span className="font-medium text-fg">{b.item}</span>
              <span className="font-bold text-green">↑</span>
              <span className="font-mono font-semibold tabular-nums accent-gradient-text">{fmtNaira(b.bid)}</span>
              <span className="text-xs text-fg-dim">
                @{b.user} · {b.city}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
