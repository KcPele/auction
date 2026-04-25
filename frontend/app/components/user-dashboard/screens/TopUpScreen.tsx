"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type MethodId = "paystack" | "transfer" | "flutter" | "monnify";
interface Method {
  id: MethodId;
  title: string;
  sub: string;
  icon: IconName;
}

const METHODS: Method[] = [
  { id: "paystack", title: "Paystack · Card / USSD", sub: "Instant · 1.5% fee capped at ₦2,000", icon: "zap" },
  { id: "transfer", title: "Bank transfer", sub: "Wema Bank · 1234567890 · BidNaija Escrow", icon: "arrow-r" },
  { id: "flutter", title: "Flutterwave", sub: "Card / Bank / Barter", icon: "refresh" },
  { id: "monnify", title: "Monnify (Virtual Account)", sub: "Your dedicated account · Free", icon: "wallet" },
];
const QUICK = [100_000, 250_000, 500_000, 1_000_000];

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

function feeFor(method: MethodId, amt: number) {
  if (method === "transfer" || method === "monnify") return "Free";
  return fmtNaira(Math.min(amt * 0.015, 2_000));
}
function methodLabel(m: MethodId) {
  return m === "paystack" ? "Paystack" : m === "flutter" ? "Flutterwave" : m === "monnify" ? "Monnify" : "bank details";
}

export function TopUpScreen() {
  const router = useRouter();
  const [amt, setAmt] = useState(500_000);
  const [method, setMethod] = useState<MethodId>("paystack");

  return (
    <>
      <div className="mt-2 text-xs uppercase tracking-[0.1em] text-fg-dim">Amount</div>
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
              amt === q ? "border-accent bg-accent/[0.1] text-accent-light" : "border-line text-fg"
            }`}
          >
            {q >= 1_000_000 ? `${q / 1_000_000}M` : `${q / 1_000}k`}
          </button>
        ))}
      </div>

      <div className="my-3 mt-5 text-[15px] font-semibold tracking-tight">Payment method</div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className="flex w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-3.5 text-left text-sm last:border-b-0"
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-accent/[0.12] text-accent" : "bg-white/[0.04] text-fg-muted"
                }`}
              >
                <Icon name={m.icon} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.title}</div>
                <div className="mt-0.5 text-xs text-fg-dim">{m.sub}</div>
              </div>
              {active ? (
                <Icon name="check-c" size={18} className="text-accent" />
              ) : (
                <div className="h-[18px] w-[18px] rounded-full border-[1.5px] border-line-strong" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span className="text-fg-muted">Amount</span>
          <span>{fmtNaira(amt)}</span>
        </div>
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span className="text-fg-muted">Processing fee</span>
          <span>{feeFor(method, amt)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold">
          <span>Wallet credit</span>
          <span className="font-mono text-accent-light">{fmtNaira(amt)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          // Integration: for monnify, POST /api/v1/wallets/funding-account to get virtual account
          alert(
            `Top up ${fmtNaira(amt)} via ${method} — in a live build, this redirects to the gateway.`,
          );
          router.back();
        }}
        className="mt-4 w-full cursor-pointer rounded-xl border-none p-4 text-sm font-bold text-[#1a0a00]"
        style={PRIMARY_BTN_BG}
      >
        Continue to {methodLabel(method)}
      </button>
    </>
  );
}
