import Link from "next/link";
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
    headline: (
      <>
        Nigeria&apos;s real-time <em className="italic font-medium accent-gradient-text">auction house</em> for cars &amp; gadgets.
      </>
    ),
    sub: "Verified inventory. 10% holds instead of frozen capital. Release the second you're outbid — win, and escrow pays the seller only when the item is in your hands.",
  },
  register: {
    eyebrow: "Create account",
    headline: (
      <>
        Create an account and start your <em className="italic font-medium accent-gradient-text">auction profile</em>.
      </>
    ),
    sub: "Verify your identity, fund your wallet, and bid through escrow-backed auctions. Your information is encrypted, and we never share it with sellers.",
  },
  verify: {
    eyebrow: "KYC · last step",
    headline: (
      <>
        Verify once, <em className="italic font-medium accent-gradient-text">bid forever</em>.
      </>
    ),
    sub: "A one-time BVN + ID check unlocks every auction on BidNaija and lets you top up without limits. Takes under two minutes.",
  },
};

interface AuthBrandPanelProps {
  variant?: BrandVariant;
}

export function AuthBrandPanel({ variant = "bid" }: AuthBrandPanelProps) {
  const copy = COPY[variant];
  return (
    <div
      className="relative hidden min-h-screen overflow-hidden border-r border-line-strong p-12 md:flex md:flex-col"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(232,183,85,0.18), transparent 55%), radial-gradient(ellipse at bottom right, rgba(239,74,58,0.08), transparent 50%), linear-gradient(150deg, #1e1709, #0d0a06)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,183,85,0.2), transparent 70%)" }}
      />

      <div className="relative z-[2] flex items-center justify-between">
        <BrandMark size={28} />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <Icon name="chevron-l" size={14} /> Back to site
        </Link>
      </div>

      <div className="relative z-[2] flex max-w-[480px] flex-1 flex-col justify-center">
        <div className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
          <span className="inline-block h-[7px] w-[7px] animate-[pulseDot_1.6s_infinite] rounded-full bg-red" />
          {copy.eyebrow}
        </div>
        <h1 className="m-0 mb-4 font-display text-[52px] font-semibold leading-[1.05] tracking-[-0.025em]">
          {copy.headline}
        </h1>
        <p className="max-w-[420px] text-[15px] leading-[1.55] text-fg-muted">{copy.sub}</p>
      </div>

      <div className="relative z-[2] mt-10 flex gap-7 text-xs text-fg-dim">
        <span className="ml-auto">© 2026 BidNaija Ltd · RC 7284102</span>
      </div>
    </div>
  );
}
