"use client";
import { useQuery } from "@tanstack/react-query";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { getCategoryStats, type CategoryStat } from "./api/public.api";
import { fmtCompactNaira } from "./utils";

const COPY: Record<
  "cars" | "gadgets",
  { num: string; title: string; desc: string; icon: React.ReactNode }
> = {
  cars: {
    num: "FLOOR 01",
    title: "Cars",
    desc: "Physically inspected by registered mechanics. Multi-angle photos, full disclosure of known faults. Dealers and individuals welcome.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="absolute -bottom-7 -right-7 h-60 w-60 text-accent opacity-[0.08]"
      >
        <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5" />
        <path d="M3 13v4h2l1-2h12l1 2h2v-4" />
        <circle cx="7" cy="15.5" r="1.3" fill="currentColor" />
        <circle cx="17" cy="15.5" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  gadgets: {
    num: "FLOOR 02",
    title: "Gadgets",
    desc: "Original receipt or police report required. Battery health, specs, usage history — all disclosed. Opt-in notifications so only serious bidders get pinged.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="absolute -bottom-7 -right-7 h-60 w-60 text-accent opacity-[0.08]"
      >
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <circle cx="12" cy="18" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
};

const numFmt = new Intl.NumberFormat("en-NG");

function priceRangeLabel(stat: CategoryStat | undefined) {
  if (!stat || (stat.priceMin === 0 && stat.priceMax === 0)) return "—";
  if (stat.priceMin === stat.priceMax) return fmtCompactNaira(stat.priceMin);
  return `${fmtCompactNaira(stat.priceMin)}–${fmtCompactNaira(stat.priceMax)}`;
}

export function Categories() {
  const { data } = useQuery({
    queryKey: ["public", "category-stats"],
    queryFn: getCategoryStats,
    staleTime: 60_000,
  });
  const byKey = new Map(data?.map((s) => [s.key, s]) ?? []);

  return (
    <Section>
      <SectionHead
        kicker="Two floors. Both serious."
        title={
          <>
            Bid on <em className="italic accent-gradient-text">cars</em> or{" "}
            <em className="italic accent-gradient-text">gadgets</em>.
            <br />
            Same rules. Same trust.
          </>
        }
        sub="Every listing is manually approved. Cars are physically inspected by registered mechanics. Gadgets require proof of ownership before they go live."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {(["cars", "gadgets"] as const).map((key) => {
          const copy = COPY[key];
          const stat = byKey.get(key);
          const stats = [
            {
              num: stat ? numFmt.format(stat.liveCount) : "—",
              lbl: "Live auctions",
            },
            { num: priceRangeLabel(stat), lbl: "Price range" },
            {
              num: stat ? `${numFmt.format(stat.settledCount)}+` : "—",
              lbl: key === "cars" ? "Cars settled" : "Gadgets settled",
            },
          ];
          return (
            <div
              key={key}
              className="relative min-h-[320px] cursor-pointer overflow-hidden rounded-lg border border-line-strong bg-[linear-gradient(165deg,var(--surface-2)_0%,var(--surface)_100%)] p-9 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              {copy.icon}
              <div className="font-mono text-[11px] tracking-[0.12em] text-fg-dim">
                {copy.num}
              </div>
              <h3 className="m-0 mb-2.5 mt-3 font-display text-5xl font-semibold tracking-[-0.02em]">
                {copy.title}
              </h3>
              <p className="mb-6 max-w-[380px] text-fg-muted">{copy.desc}</p>
              <div className="flex flex-wrap gap-8">
                {stats.map((s) => (
                  <div key={s.lbl}>
                    <div className="font-mono text-xl font-semibold accent-gradient-text">
                      {s.num}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-fg-dim">
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
