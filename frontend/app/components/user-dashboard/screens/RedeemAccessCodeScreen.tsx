"use client";
import { useState } from "react";
import { Icon } from "../primitives/Icon";

export function RedeemAccessCodeScreen() {
  const [code, setCode] = useState("");
  const [redeemed, setRedeemed] = useState(false);

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">Redeem access code</h1>
      <div className="mt-1 text-sm text-fg-muted">
        Enter your BidNaija access code to unlock listing and bidding features.
      </div>

      {redeemed ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green/15 text-green">
            <Icon name="check-c" size={32} />
          </div>
          <div className="mt-3 text-lg font-semibold">Code redeemed!</div>
          <div className="mt-1 text-sm text-fg-muted">Your access has been activated.</div>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <label className="mb-1 block text-xs font-medium text-fg-muted">Access code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BN-XXXX-XXXX"
              maxLength={12}
              className="w-full rounded-[10px] border border-line-strong bg-surface-2 px-3.5 py-3 text-center font-mono text-base font-semibold tracking-[0.15em] text-fg outline-none focus:border-accent placeholder:text-fg-dim"
            />
          </div>

          <button
            type="button"
            disabled={code.length < 8}
            onClick={() => {
              // Integration: POST /api/v1/users/me/access-codes/redeem { code }
              setRedeemed(true);
            }}
            className="mt-4 w-full cursor-pointer rounded-xl border-none p-4 text-sm font-bold text-[#1a0a00] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(180deg, var(--accent-light), var(--accent))" }}
          >
            Redeem code
          </button>
        </>
      )}
    </>
  );
}
