import Link from "next/link";
import { BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "../landing/BrandMark";
import { Icon } from "./primitives/Icon";

export type BrandVariant = "bid" | "register" | "verify";

interface Copy {
  eyebrow: string;
  headline: ReactNode;
  sub: string;
}

const COPY: Record<BrandVariant, Copy> = {
  bid: {
    eyebrow: "Auction floor",
    headline: "Bid with confidence on verified cars and gadgets.",
    sub: "Transparent auctions, secure payments, and clear delivery tracking from one trusted account.",
  },
  register: {
    eyebrow: "Create account",
    headline: "One account for every auction.",
    sub: "Create your bidder profile, manage payments, and follow each purchase from bid to delivery.",
  },
  verify: {
    eyebrow: "KYC · last step",
    headline: "Protect your account with quick verification.",
    sub: "A short identity check helps us keep auctions fair and payments secure.",
  },
};

interface AuthBrandPanelProps {
  variant?: BrandVariant;
}

export function AuthBrandPanel({ variant = "bid" }: AuthBrandPanelProps) {
  const copy = COPY[variant];
  return (
    <aside className="relative hidden min-h-screen overflow-hidden border-r border-border bg-contrast p-12 text-contrast-foreground md:flex md:flex-col">
      <div className="relative z-10 flex items-center justify-between">
        <BrandMark size={28} tone="inverse" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-contrast-foreground/20 px-3.5 py-2 text-sm text-contrast-foreground/75 transition-colors hover:border-contrast-foreground/40 hover:text-contrast-foreground"
        >
          <Icon name="chevron-l" size={14} /> Back to site
        </Link>
      </div>

      <div className="relative z-10 flex max-w-lg flex-1 flex-col justify-center">
        <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-contrast-foreground/70">
          <span className="inline-block size-2 rounded-full bg-primary" />
          {copy.eyebrow}
        </div>
        <h1 className="m-0 mb-5 max-w-xl font-display text-5xl font-semibold leading-tight tracking-tight">
          {copy.headline}
        </h1>
        <p className="max-w-md text-base leading-7 text-contrast-foreground/70">{copy.sub}</p>

        <div className="mt-10 grid gap-4 text-sm text-contrast-foreground/75">
          <span className="flex items-center gap-3"><BadgeCheck size={18} /> Verified listings</span>
          <span className="flex items-center gap-3"><LockKeyhole size={18} /> Secure account access</span>
          <span className="flex items-center gap-3"><ShieldCheck size={18} /> Protected payments</span>
        </div>
      </div>

      <div className="relative z-10 mt-10 flex gap-7 text-xs text-contrast-foreground/55">
        <span className="ml-auto">© 2026 BidNaija Ltd · RC 7284102</span>
      </div>
    </aside>
  );
}
