"use client";
import { useQuery } from "@tanstack/react-query";
import { FeaturedCard } from "./FeaturedCard";
import { Button } from "./primitives/Button";
import { LiveDot } from "./primitives/LiveDot";
import { getPublicStats } from "./api/public.api";
import { fmtCompactNaira } from "./utils";

const HERO_GLOW =
  "radial-gradient(ellipse at 50% 30%, rgba(255,122,26,0.45) 0%, transparent 50%), radial-gradient(ellipse at 30% 40%, rgba(255,180,70,0.22) 0%, transparent 40%), radial-gradient(ellipse at 70% 50%, rgba(184,68,13,0.3) 0%, transparent 45%)";

export function Hero() {
  const { data: stats } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: getPublicStats,
    staleTime: 60_000,
  });

  const numFmt = new Intl.NumberFormat("en-NG");
  const items = [
    { num: stats ? fmtCompactNaira(stats.tradedVolume) : "—", label: "Traded volume" },
    { num: stats ? numFmt.format(stats.verifiedBidders) : "—", label: "Verified bidders" },
    { num: stats ? `${stats.settlementRate}%` : "—", label: "Settled in 24h" },
  ];

  return (
    <section className="relative isolate overflow-hidden px-5 py-20 pb-[120px] md:px-10">
      <div
        className="pointer-events-none absolute left-1/2 top-[-200px] -z-10 h-[900px] w-[1400px] -translate-x-1/2 opacity-40 blur-[20px] md:opacity-100"
        style={{ background: HERO_GLOW }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,170,90,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 100%",
          maskImage: "radial-gradient(ellipse at top, #000 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, #000 20%, transparent 70%)",
        }}
      />
      <div className="mx-auto grid max-w-[1280px] items-center gap-15 md:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-[rgba(255,122,26,0.08)] px-3.5 py-[7px] text-xs font-semibold uppercase tracking-[0.08em] accent-gradient-text">
            <LiveDot />
            Nigeria&apos;s auction floor · Cars & Gadgets
          </div>
          <h1 className="my-6 mb-5 font-display text-[clamp(48px,6vw,88px)] font-semibold leading-[0.98] tracking-[-0.025em] text-fg">
            Bid smart.
            <br />
            Win{" "}
            <em className="italic accent-gradient-text">loud.</em>
          </h1>
          <p className="max-w-[520px] text-[19px] leading-[1.55] text-fg-muted">
            A serious auction platform for cars and gadgets across Nigeria. Every listing is verified. Every bid is backed by real funds. Every payment runs through Strowallet — no drama.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Button href="/register" variant="primary" size="lg">
              Browse live auctions
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
            <Button href="/login" variant="ghost" size="lg">
              Apply to list
            </Button>
          </div>
          <div className="mt-12 grid max-w-[520px] grid-cols-3 gap-6 border-t border-line pt-8">
            {items.map((s) => (
              <div key={s.label}>
                <div className="font-display text-[32px] font-semibold tracking-[-0.02em] text-fg">{s.num}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-fg-dim">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <FeaturedCard />
      </div>
    </section>
  );
}
