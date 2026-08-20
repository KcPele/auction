"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useInitiateTopup,
  useSimulateTopup,
} from "@/app/components/wallet/hooks/use-wallet";
import { ApiError } from "@/app/lib/api/error";
import type { FundingAccount } from "@/app/components/wallet/types/wallet.types";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

// True in dev/staging — backend ALSO gates the endpoint behind
// STROWALLET_MODE=sandbox so prod can't free-money itself even if this leaks.
const IS_SANDBOX =
  (process.env.NEXT_PUBLIC_PAYMENTS_MODE ?? "sandbox") !== "live";

const QUICK = [100_000, 250_000, 500_000, 1_000_000];

export function TopUpScreen() {
  const [amt, setAmt] = useState(500_000);
  const [account, setAccount] = useState<FundingAccount | null>(null);

  const initiate = useInitiateTopup();

  const onContinue = async () => {
    try {
      const res = await initiate.mutateAsync({
        amountNaira: amt,
        method: "bank_transfer",
      });
      setAccount(res);
      toast.success("Funding account ready");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not start top-up");
    }
  };

  if (account) {
    return <FundingDetails account={account} amount={amt} />;
  }

  return (
    <>
      <div className="mt-2 text-xs uppercase tracking-[0.1em] text-fg-dim">
        Amount
      </div>
      <div className="mt-1 font-display text-[46px] font-semibold tracking-tight tabular-nums">
        <span className="text-[26px] text-fg-dim">₦</span>
        {amt.toLocaleString("en-NG")}
      </div>

      <div className="my-3 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmt(q)}
            className={`cursor-pointer rounded-lg border bg-surface px-1 py-3 text-center font-mono text-[12px] font-semibold ${
              amt === q
                ? "border-accent bg-accent/[0.1] text-accent-light"
                : "border-line text-fg"
            }`}
          >
            {q >= 1_000_000 ? `${q / 1_000_000}M` : `${q / 1_000}k`}
          </button>
        ))}
      </div>

      <div className="my-3 mt-5 text-[15px] font-semibold tracking-tight">
        Payment method
      </div>
      <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-sm">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/[0.12] text-accent">
          <Icon name="wallet" size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Bank transfer</div>
          <div className="mt-0.5 text-xs text-fg-dim">
            Dedicated Strowallet virtual account · Free
          </div>
        </div>
        <Icon name="check-c" size={18} className="text-accent" />
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span className="text-fg-muted">Amount</span>
          <span>{fmtNaira(amt)}</span>
        </div>
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span className="text-fg-muted">Processing fee</span>
          <span>Free</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold">
          <span>Wallet credit</span>
          <span className="font-mono text-accent-light">{fmtNaira(amt)}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={initiate.isPending}
        onClick={onContinue}
        className="mt-4 w-full cursor-pointer rounded-xl border-none bg-primary p-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {initiate.isPending ? "Preparing…" : "Continue"}
      </button>
    </>
  );
}

function FundingDetails({
  account,
  amount,
}: {
  account: FundingAccount;
  amount: number;
}) {
  const simulate = useSimulateTopup();
  const copy = (val: string) =>
    navigator.clipboard
      .writeText(val)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Could not copy"));

  const onSimulate = async () => {
    try {
      await simulate.mutateAsync({ amountNaira: amount });
      toast.success(`Wallet credited ${fmtNaira(amount)} (sandbox)`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not simulate payment",
      );
    }
  };

  return (
    <>
      <div className="mt-2 text-xs uppercase tracking-[0.1em] text-fg-dim">
        Send exactly
      </div>
      <div className="mt-1 font-display text-[42px] font-semibold tracking-tight tabular-nums">
        <span className="text-[24px] text-fg-dim">₦</span>
        {amount.toLocaleString("en-NG")}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <Row label="Bank" value={account.bankName} onCopy={() => copy(account.bankName)} />
        <Row
          label="Account number"
          value={account.accountNumber}
          mono
          onCopy={() => copy(account.accountNumber)}
        />
        <Row
          label="Account name"
          value={account.accountName}
          onCopy={() => copy(account.accountName)}
        />
        <Row
          label="Reference"
          value={account.reference}
          mono
          onCopy={() => copy(account.reference)}
        />
      </div>

      <div className="mt-3 rounded-xl border border-accent/15 bg-accent/[0.04] p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-accent">
            <Icon name="lock" size={18} />
          </div>
          <div className="text-xs leading-[1.5] text-fg-muted">
            Transfer from a bank account in your name. Your wallet credits within
            seconds of confirmation.
          </div>
        </div>
      </div>

      {IS_SANDBOX && (
        <div className="mt-3 rounded-xl border border-dashed border-accent/30 bg-accent/[0.03] p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
            Sandbox testing
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            No real bank transfer? Click below to simulate the payment hitting
            the virtual account. Only available in sandbox mode.
          </div>
          <button
            type="button"
            disabled={simulate.isPending}
            onClick={onSimulate}
            className="mt-2.5 w-full cursor-pointer rounded-lg border border-accent/40 bg-accent/[0.08] p-2.5 text-xs font-semibold text-accent disabled:opacity-60"
          >
            {simulate.isPending
              ? "Crediting…"
              : `Simulate ${fmtNaira(amount)} payment`}
          </button>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0">
      <div>
        <div className="text-[11px] text-fg-dim">{label}</div>
        <div className={`mt-0.5 text-sm ${mono ? "font-mono tabular-nums" : ""}`}>
          {value}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={onCopy}
        className="rounded-md border border-line bg-surface-2 p-2 text-fg-muted hover:text-fg"
      >
        <Icon name="copy" size={14} />
      </button>
    </div>
  );
}
