"use client";
import { useDelivery } from "@/app/components/auctions/hooks/use-auctions";
import type { DeliveryStatusWire } from "@/app/components/auctions/api/auction.api";
import { Icon, type IconName } from "../primitives/Icon";

const STEPS: {
  key: DeliveryStatusWire;
  label: string;
  icon: IconName;
}[] = [
  { key: "PAYMENT_CONFIRMED", label: "Payment confirmed", icon: "check-c" },
  { key: "SELLER_SHIPS", label: "Seller ships item", icon: "truck" },
  { key: "INSPECTION", label: "Inspection period", icon: "search" },
  { key: "DISPATCH", label: "Dispatched to buyer", icon: "package" },
  { key: "DELIVERED", label: "Delivered", icon: "home" },
];

const stepIndex = (status: DeliveryStatusWire) =>
  STEPS.findIndex((s) => s.key === status);

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function DeliveryTrackingScreen({ auctionId }: { auctionId: string }) {
  const { data, isLoading, isError, refetch } = useDelivery(auctionId);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-fg-dim">Loading…</div>
    );
  }
  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-fg-dim">Could not load delivery status.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium text-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentIdx = stepIndex(data.status);

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">
        Delivery tracking
      </h1>
      <div className="mt-1 font-mono text-[11px] text-fg-dim">
        Auction ID: {auctionId}
      </div>

      {data.trackingInfo && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">
            Tracking info
          </div>
          <div className="mt-1 font-mono text-sm font-semibold">
            {data.trackingInfo}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-0">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    done
                      ? "bg-green/15 text-green"
                      : "bg-surface-2 text-fg-dim"
                  }`}
                >
                  <Icon name={step.icon} size={16} />
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`my-1 w-[2px] flex-1 ${
                      done ? "bg-green/30" : "bg-line"
                    }`}
                  />
                )}
              </div>
              <div className="pb-6 pt-1">
                <div
                  className={`text-sm font-medium ${
                    done ? "text-fg" : "text-fg-dim"
                  }`}
                >
                  {step.label}
                  {current && (
                    <span className="ml-2 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent">
                      CURRENT
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center text-[11px] text-fg-dim">
        Last updated: {dateFmt.format(data.updatedAt)}
      </div>
    </>
  );
}
