import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";

interface CatData {
  num: string;
  title: string;
  desc: string;
  stats: { num: string; lbl: string }[];
  icon: React.ReactNode;
}

const CATS: CatData[] = [
  {
    num: "FLOOR 01",
    title: "Cars",
    desc: "Physically inspected by registered mechanics. Multi-angle photos, full disclosure of known faults. Dealers and individuals welcome.",
    stats: [
      { num: "247", lbl: "Live auctions" },
      { num: "₦3.2M–₦42M", lbl: "Price range" },
      { num: "3,100+", lbl: "Cars settled" },
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute -bottom-7 -right-7 h-60 w-60 text-accent opacity-[0.08]">
        <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5" />
        <path d="M3 13v4h2l1-2h12l1 2h2v-4" />
        <circle cx="7" cy="15.5" r="1.3" fill="currentColor" />
        <circle cx="17" cy="15.5" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: "FLOOR 02",
    title: "Gadgets",
    desc: "Original receipt or police report required. Battery health, specs, usage history — all disclosed. Opt-in notifications so only serious bidders get pinged.",
    stats: [
      { num: "1,042", lbl: "Live auctions" },
      { num: "₦85K–₦4.5M", lbl: "Price range" },
      { num: "8,700+", lbl: "Gadgets settled" },
    ],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute -bottom-7 -right-7 h-60 w-60 text-accent opacity-[0.08]">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <circle cx="12" cy="18" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
];

export function Categories() {
  return (
    <Section>
      <SectionHead
        kicker="Two floors. Both serious."
        title={
          <>
            Bid on <em className="italic accent-gradient-text">cars</em> or <em className="italic accent-gradient-text">gadgets</em>.
            <br />
            Same rules. Same trust.
          </>
        }
        sub="Every listing is manually approved. Cars are physically inspected by registered mechanics. Gadgets require proof of ownership before they go live."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {CATS.map((c) => (
          <div
            key={c.num}
            className="relative min-h-[320px] cursor-pointer overflow-hidden rounded-lg border border-line-strong bg-[linear-gradient(165deg,var(--surface-2)_0%,var(--surface)_100%)] p-9 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
          >
            {c.icon}
            <div className="font-mono text-[11px] tracking-[0.12em] text-fg-dim">{c.num}</div>
            <h3 className="m-0 mb-2.5 mt-3 font-display text-5xl font-semibold tracking-[-0.02em]">{c.title}</h3>
            <p className="mb-6 max-w-[380px] text-fg-muted">{c.desc}</p>
            <div className="flex flex-wrap gap-8">
              {c.stats.map((s) => (
                <div key={s.lbl}>
                  <div className="font-mono text-xl font-semibold accent-gradient-text">{s.num}</div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-fg-dim">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
