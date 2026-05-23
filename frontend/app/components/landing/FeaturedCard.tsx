"use client";
import { useQuery } from "@tanstack/react-query";
import { Countdown } from "./Countdown";
import { Placeholder } from "./Placeholder";
import { Button } from "./primitives/Button";
import { LiveDot } from "./primitives/LiveDot";
import { fmtNaira } from "./utils";
import { getFeaturedAuction } from "./api/public.api";

export function FeaturedCard() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["public", "featured-auction"],
    queryFn: getFeaturedAuction,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="relative rounded-lg border border-line-strong bg-[linear-gradient(180deg,var(--surface-2),var(--surface))] p-[22px]">
        <div className="text-sm text-fg-muted">Loading featured auction…</div>
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="relative rounded-lg border border-line-strong bg-[linear-gradient(180deg,var(--surface-2),var(--surface))] p-[22px]">
        <div className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-dim">
          Coming soon
        </div>
        <h3 className="m-0 mb-1 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.015em] text-fg">
          No live auctions yet
        </h3>
        <p className="mb-4 text-[13px] text-fg-muted">
          Sign up to be notified the moment the first auction opens.
        </p>
        <Button href="/register" variant="primary" className="w-full justify-center">
          Sign up
        </Button>
      </div>
    );
  }

  const isLive = featured.status === "LIVE";
  const holdAmount = Math.round((featured.currentBid * (featured.holdPercent / 100)) / 1000) * 1000;
  const endTarget = featured.endTime.getTime();
  const startTarget = featured.startTime.getTime();
  const target = isLive ? endTarget : startTarget;
  const idShort = featured.id.slice(0, 8).toUpperCase();

  return (
    <div className="relative rounded-lg border border-line-strong bg-[linear-gradient(180deg,var(--surface-2),var(--surface))] p-[22px] shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,180,90,0.05)] transition-transform duration-[400ms] [transform:perspective(1200px)_rotateY(-3deg)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateY(-1deg)_rotateX(1deg)_translateY(-4px)]">
      <div className="mb-4 flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${isLive ? "text-red" : "text-accent"}`}>
          {isLive && <LiveDot />}
          {isLive ? "LIVE NOW · FEATURED" : "STARTING SOON · FEATURED"}
        </div>
        <div className="font-mono text-[11px] text-fg-dim">#AUC-{idShort}</div>
      </div>

      <div className="mb-4 overflow-hidden rounded-md">
        <Placeholder aspect="16/10" kind={featured.category} tag={featured.category === "car" ? "CAR" : "GADGET"} />
      </div>

      <h3 className="m-0 mb-1 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.015em] text-fg">
        {featured.title}
      </h3>
      <div className="mb-4 text-[13px] text-fg-muted">
        {featured.subtitle || "Verified listing"}
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3 rounded-md border border-line bg-black/35 p-3.5">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-fg-dim">{isLive ? "Current bid" : "Base price"}</div>
          <div className="font-mono text-[22px] font-semibold tabular-nums accent-gradient-text">
            {fmtNaira(featured.currentBid)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-fg-dim">{isLive ? "Ends in" : "Starts in"}</div>
          <Countdown target={target} size="lg" label="" />
        </div>
      </div>

      <div className="mb-3.5 flex items-center justify-between text-xs text-fg-muted">
        <span>{featured.bidders} bidder{featured.bidders === 1 ? "" : "s"}</span>
        <span>{featured.holdPercent}% hold · {fmtNaira(holdAmount)}</span>
      </div>

      <div className="flex gap-2.5">
        <Button href="/register" variant="primary" className="flex-1 justify-center">
          {isLive ? "Place a bid" : "Get notified"}
        </Button>
        <Button href="/login" variant="ghost" className="flex-1 justify-center">
          Full details
        </Button>
      </div>
    </div>
  );
}
