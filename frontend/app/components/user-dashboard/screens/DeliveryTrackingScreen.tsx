"use client";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";
import type { DeliveryInfo, DeliveryStatus } from "../types";

const MOCK_DELIVERY: DeliveryInfo = {
  auctionId: "a-4455",
  auctionTitle: "iPhone 15 Pro Max · 256GB",
  status: "SELLER_SHIPS",
  trackingNumber: "GIG-2948103",
  carrier: "GIG Logistics",
  updatedAt: "2026-05-04T10:30:00Z",
  history: [
    { status: "PAYMENT_CONFIRMED", timestamp: "2026-05-03T14:00:00Z", note: "Payment confirmed by admin" },
    { status: "SELLER_SHIPS", timestamp: "2026-05-04T10:30:00Z", note: "Seller handed item to carrier" },
  ],
};

const STEPS: { key: DeliveryStatus; label: string; icon: "check-c" | "truck" | "search" | "package" | "home" }[] = [
  { key: "PAYMENT_CONFIRMED", label: "Payment confirmed", icon: "check-c" },
  { key: "SELLER_SHIPS", label: "Seller ships item", icon: "truck" },
  { key: "INSPECTION", label: "Inspection period", icon: "search" },
  { key: "DISPATCH", label: "Dispatched to buyer", icon: "package" },
  { key: "DELIVERED", label: "Delivered", icon: "home" },
];

function stepIndex(status: DeliveryStatus) {
  return STEPS.findIndex((s) => s.key === status);
}

export function DeliveryTrackingScreen({ auctionId }: { auctionId: string }) {
  // Integration: GET /api/v1/auctions/{auctionId}/delivery
  const info = MOCK_DELIVERY;
  const currentIdx = stepIndex(info.status);

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-semibold tracking-tight">Delivery tracking</h1>
      <div className="mt-1 text-sm text-fg-muted">{info.auctionTitle}</div>

      {info.trackingNumber && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Tracking number</div>
          <div className="mt-1 font-mono text-sm font-semibold">{info.trackingNumber}</div>
          {info.carrier && <div className="mt-0.5 text-xs text-fg-muted">via {info.carrier}</div>}
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
                  <div className={`my-1 w-[2px] flex-1 ${done ? "bg-green/30" : "bg-line"}`} />
                )}
              </div>
              <div className={`pb-6 ${current ? "pt-1" : "pt-1"}`}>
                <div className={`text-sm font-medium ${done ? "text-fg" : "text-fg-dim"}`}>
                  {step.label}
                  {current && (
                    <span className="ml-2 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent">
                      CURRENT
                    </span>
                  )}
                </div>
                {info.history.find((h) => h.status === step.key)?.note && (
                  <div className="mt-0.5 text-xs text-fg-dim">
                    {info.history.find((h) => h.status === step.key)?.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center text-[11px] text-fg-dim">
        Last updated: {new Date(info.updatedAt).toLocaleString("en-NG")}
      </div>
    </>
  );
}
