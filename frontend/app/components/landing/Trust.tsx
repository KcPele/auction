import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import type { ReactNode } from "react";

interface TrustItem {
  icon: ReactNode;
  title: string;
  desc: string;
}

const ICON = (path: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    {path}
  </svg>
);

const ITEMS: TrustItem[] = [
  {
    icon: ICON(
      <>
        <path d="M12 2L3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6l-9-4z" />
        <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    ),
    title: "Mechanic-verified cars",
    desc: "Every car is inspected in person by a registered mechanic before listing. Multi-angle photos. Known faults disclosed up-front.",
  },
  {
    icon: ICON(
      <>
        <rect x="4" y="4" width="16" height="18" rx="2" />
        <path d="M8 2v4M16 2v4M8 11h8M8 15h8M8 19h5" strokeLinecap="round" />
      </>,
    ),
    title: "Proof on every gadget",
    desc: "Listers upload the original receipt — or a police report if the box is missing. No proof, no listing. Admin reviews every single one.",
  },
  {
    icon: ICON(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </>,
    ),
    title: "Admin-approved listings",
    desc: "Nothing goes live without a human admin review. Photos, details, proof — checked once before the timer even starts.",
  },
  {
    icon: ICON(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" strokeLinecap="round" />
      </>,
    ),
    title: "Strowallet-settled payments",
    desc: "Every movement of money rides on Strowallet rails — widely accepted, fast. All webhooks signature-verified server-side.",
  },
  {
    icon: ICON(<path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />),
    title: "Full audit ledger",
    desc: "Every bid. Every hold. Every release. Every payout. Logged as a ledger entry. Disputes get resolved against the record — not vibes.",
  },
  {
    icon: ICON(
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </>,
    ),
    title: "Access-gated supply",
    desc: "Listing requires an access code issued by an admin. This keeps the supply side trusted and verified — not flooded with noise.",
  },
];

export function Trust() {
  return (
    <Section id="trust" className="bg-[linear-gradient(180deg,transparent,rgba(255,122,26,0.03),transparent)]">
      <SectionHead
        kicker="Trust & safety"
        title={
          <>
            Nigeria is <em className="italic accent-gradient-text">picky.</em> So are we.
          </>
        }
        sub="Six layers between a listing and a live auction. If it passes, you can bid with your chest."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <div key={it.title} className="relative overflow-hidden rounded-lg border border-line bg-surface p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-line-strong bg-[linear-gradient(180deg,rgba(245,213,128,0.18),rgba(232,183,85,0.12))] text-accent">
              {it.icon}
            </div>
            <h3 className="m-0 mb-2 font-display text-[22px] font-semibold tracking-[-0.015em]">{it.title}</h3>
            <p className="text-sm leading-[1.55] text-fg-muted">{it.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
