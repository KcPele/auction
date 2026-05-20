"use client";
import { useRouter } from "next/navigation";
import { useWonAuctions } from "@/app/components/users/hooks/use-users";
import type { WonAuction } from "@/app/components/users/types/users.types";
import { Icon } from "../primitives/Icon";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  payment_confirmed: {
    label: "Confirmed",
    cls: "border-green/30 bg-green/10 text-green",
  },
  payment_pending: {
    label: "Pay now",
    cls: "border-red/30 bg-red/10 text-red",
  },
  seller_ships: {
    label: "Shipping",
    cls: "border-accent/30 bg-accent/10 text-accent",
  },
  inspecting: {
    label: "Inspecting",
    cls: "border-accent/30 bg-accent/10 text-accent",
  },
  delivered: {
    label: "Delivered",
    cls: "border-green/30 bg-green/10 text-green",
  },
};

function badge(status: string) {
  const key = status.toLowerCase();
  const s = STATUS_BADGE[key] ?? {
    label: status,
    cls: "border-line bg-surface-2 text-fg-dim",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function WonAuctionsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useWonAuctions();
  const won = data ?? [];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">
          Won auctions
        </h1>
        <span className="text-xs text-fg-dim">{won.length} items</span>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
      ) : isError ? (
        <div className="py-10 text-center">
          <p className="text-sm text-fg-dim">Could not load.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs text-accent"
          >
            Retry
          </button>
        </div>
      ) : won.length === 0 ? (
        <div className="mt-12 text-center text-sm text-fg-muted">
          <Icon name="gavel" size={40} className="mx-auto mb-3 text-fg-dim" />
          <p>No won auctions yet. Keep bidding!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {won.map((w) => (
            <Card key={w.auctionId} w={w} router={router} />
          ))}
        </div>
      )}
    </>
  );
}

function Card({
  w,
  router,
}: {
  w: WonAuction;
  router: ReturnType<typeof useRouter>;
}) {
  const isPaymentPending = !w.paidAt;
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[14px] font-semibold">{w.title}</div>
          <div className="mt-1 text-xs text-fg-dim">
            {w.wonAt
              ? w.wonAt.toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </div>
        </div>
        {badge(w.deliveryStatus)}
      </div>

      {isPaymentPending && (
        <button
          type="button"
          onClick={() => router.push(`/dashboard/auction/${w.auctionId}/payment`)}
          className="mt-3 w-full rounded-lg border-none p-2.5 text-xs font-bold text-[#1a0a00] accent-gradient-bg"
        >
          View payment instructions
        </button>
      )}

      {!isPaymentPending && (
        <button
          type="button"
          onClick={() => router.push(`/dashboard/auction/${w.auctionId}/delivery`)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface p-2.5 text-xs font-medium text-fg"
        >
          <Icon name="truck" size={14} /> Track delivery
        </button>
      )}
    </div>
  );
}
