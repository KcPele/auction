"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/app/components/user-dashboard/primitives/Icon";
import { fmtNaira } from "@/app/components/user-dashboard/utils";
import { ApiError } from "@/app/lib/api/error";
import { usePlaceBid } from "../hooks/use-auctions";

const BID_BAR_BG = {
  background: "linear-gradient(180deg, transparent, var(--bg) 20%)",
  paddingBottom: "calc(var(--nav-h) + 14px + env(safe-area-inset-bottom))",
};

const BID_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

interface Props {
  auctionId: string;
  topBidNaira: number;
  minIncrementNaira: number;
}

export function BidBar({ auctionId, topBidNaira, minIncrementNaira }: Props) {
  const suggested = topBidNaira + minIncrementNaira;
  const [amt, setAmt] = useState(suggested);
  const place = usePlaceBid(auctionId);

  const onPlace = async () => {
    if (amt < suggested) {
      toast.error(`Min bid is ${fmtNaira(suggested)}`);
      return;
    }
    try {
      await place.mutateAsync({ amountNaira: amt });
      toast.success(`Bid placed at ${fmtNaira(amt)}`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not place bid");
    }
  };

  return (
    <div
      className="sticky bottom-0 -mx-[18px] -mb-6 flex items-center gap-2.5 px-[18px] pt-3.5"
      style={BID_BAR_BG}
    >
      <div className="flex-1">
        <div className="mb-1 text-[9px] uppercase tracking-[0.08em] text-fg-dim">
          Your bid (min {fmtNaira(suggested)})
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-3.5 py-3 focus-within:border-accent">
          <span className="select-none font-mono text-base font-semibold text-fg-muted">
            ₦
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent font-mono text-base font-semibold text-fg outline-none"
            type="text"
            inputMode="numeric"
            value={amt ? amt.toLocaleString("en-NG") : ""}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
              setAmt(n || 0);
            }}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={place.isPending}
        onClick={onPlace}
        className="cursor-pointer whitespace-nowrap rounded-xl border-none px-5 py-3.5 text-sm font-bold text-[#1a0a00] disabled:opacity-60"
        style={BID_BTN_BG}
      >
        {place.isPending ? (
          <>
            <Icon name="refresh" size={14} className="mr-1.5 inline-block" />
            …
          </>
        ) : (
          "Place bid"
        )}
      </button>
    </div>
  );
}
