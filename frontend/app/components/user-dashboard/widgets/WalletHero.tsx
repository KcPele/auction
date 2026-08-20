"use client";
import Link from "next/link";
import { useWallet } from "@/app/components/wallet/hooks/use-wallet";
import { formatNGN } from "@/app/lib/format/money";
import { Icon } from "../primitives/Icon";

interface WalletHeroProps {
  showActions?: boolean;
}

export function WalletHero({ showActions = true }: WalletHeroProps) {
  const { data, isLoading } = useWallet();

  // Display in kobo because formatNGN expects kobo. We have naira → multiply by 100.
  const fmt = (naira: number) => formatNGN(Math.round(naira * 100));
  const total = data ? data.balance : 0;
  const available = data?.available ?? 0;
  const held = data?.held ?? 0;

  return (
    <div className="relative my-3.5 mb-5 overflow-hidden rounded-[22px] border border-line-strong bg-[var(--feature-surface)] p-5">
      <div
        className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[200px] w-[200px] rounded-full"
        style={{ background: "var(--feature-glow)" }}
      />
      <div className="text-[11px] uppercase tracking-[0.12em] text-fg-dim">
        Wallet balance
      </div>
      <div className="my-1.5 mb-3 font-display text-[40px] font-semibold leading-none tracking-tight tabular-nums">
        {isLoading && !data ? (
          <span className="text-fg-dim">…</span>
        ) : (
          <>
            <span className="mr-0.5 text-[22px] text-fg-dim">₦</span>
            {total.toLocaleString("en-NG")}
          </>
        )}
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-line bg-surface/70 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-green" /> Available
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {fmt(available)}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface/70 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Held for bids
          </div>
          <div className="font-mono text-base font-semibold tabular-nums">
            {fmt(held)}
          </div>
        </div>
      </div>
      {showActions && (
        <div className="relative z-10 mt-3.5 flex gap-2">
          <Link
            href="/dashboard/wallet/topup"
            className="button-primary inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-[13px] font-semibold transition-colors"
          >
            <Icon name="plus" size={14} /> Top up
          </Link>
          <Link
            href="/dashboard/wallet"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-surface-subtle px-2.5 py-2.5 text-[13px] font-semibold text-fg"
          >
            <Icon name="chart" size={14} /> Activity
          </Link>
        </div>
      )}
    </div>
  );
}
