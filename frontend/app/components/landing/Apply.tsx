import { Section } from "./Section";
import { Button } from "./primitives/Button";

interface CodeRow {
  label: string;
  title: string;
  sub: string;
  status: string;
  statusColor: string;
  icon: React.ReactNode;
  emphasized?: boolean;
}

const CODES: CodeRow[] = [
  {
    label: "CAR-CODE",
    title: "List vehicles",
    sub: "Requires a registered mechanic partner",
    status: "REQUEST",
    statusColor: "text-accent",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 5" />
        <path d="M3 13v4h2l1-2h12l1 2h2v-4" />
      </svg>
    ),
  },
  {
    label: "GADGET-CODE",
    title: "List gadgets",
    sub: "Requires proof of ownership per item",
    status: "REQUEST",
    statusColor: "text-accent",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="3" width="12" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: "HOLD BOTH",
    title: "One user, both codes",
    sub: "Requires proof of ownership per item",
    status: "AVAILABLE",
    statusColor: "text-accent-2",
    emphasized: true,
    icon: <span className="font-bold">★</span>,
  },
];

export function Apply() {
  return (
    <Section id="sell">
      <div
        className="relative grid items-center gap-15 overflow-hidden rounded-lg border border-line-strong px-12 py-[72px] md:grid-cols-[1.3fr_1fr]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,122,26,0.15), rgba(184,68,13,0.08)), linear-gradient(180deg, var(--surface-2), var(--surface))",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px]"
          style={{ background: "radial-gradient(circle, rgba(255,122,26,0.3), transparent 65%)" }}
        />
        <div className="relative">
          <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Become an approved lister
          </div>
          <h2 className="m-0 mb-4 font-display text-[clamp(32px,3.5vw,48px)] font-semibold leading-[1.05] tracking-[-0.025em]">
            Got cars or gadgets to move?
            <br />
            <span className="italic text-accent-2">Apply for an access code.</span>
          </h2>
          <p className="mb-7 text-[17px] leading-[1.55] text-fg-muted">
            Listing is gated on purpose — it&apos;s what keeps the supply side trusted. Apply for a car code, a gadget code, or both. Admin reviews. Approved listers see a &quot;List&quot; section unlocked on their dashboard.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="lg">
              Apply now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
            <Button variant="ghost" size="lg">
              Lister FAQ
            </Button>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          {CODES.map((c) => (
            <div
              key={c.label}
              className={`flex items-center gap-4 rounded-md border border-dashed border-line-strong p-4 px-5 ${
                c.emphasized ? "bg-[rgba(255,122,26,0.05)]" : "bg-black/35"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[22px] ${
                  c.emphasized ? "bg-accent text-[#0a0806]" : "bg-[rgba(255,122,26,0.1)] text-accent"
                }`}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-[0.1em] text-fg-dim">{c.label}</div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-fg-muted">{c.sub}</div>
              </div>
              <div className={`font-mono text-[11px] ${c.statusColor}`}>{c.status}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
