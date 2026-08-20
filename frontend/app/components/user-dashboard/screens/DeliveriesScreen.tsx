"use client";

import Link from "next/link";
import { useMyDeliveries } from "@/app/components/users/hooks/use-users";
import type { UserDelivery } from "@/app/components/users/types/users.types";
import { Icon } from "../primitives/Icon";

const STATUS_LABEL: Record<UserDelivery["status"], string> = {
  PAYMENT_CONFIRMED: "Payment confirmed",
  SELLER_SHIPS: "Seller shipping",
  INSPECTION: "Inspection",
  DISPATCH: "Dispatched",
  DELIVERED: "Delivered",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export function DeliveriesScreen() {
  const deliveries = useMyDeliveries();
  const items = deliveries.data ?? [];

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Deliveries
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        Purchases and sales that are moving through delivery.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {deliveries.isLoading ? (
          <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>
        ) : deliveries.isError ? (
          <div className="py-10 text-center text-sm text-fg-dim">
            Could not load deliveries.{" "}
            <button onClick={() => deliveries.refetch()} className="text-primary">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-fg-dim">
            No active deliveries yet.
          </div>
        ) : (
          items.map((item) => <DeliveryCard key={item.auctionId} item={item} />)
        )}
      </div>
    </>
  );
}

function DeliveryCard({ item }: { item: UserDelivery }) {
  const complete = item.status === "DELIVERED";
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${complete ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}>
          <Icon name={complete ? "check-c" : "truck"} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{item.title}</h2>
            <span className="rounded-full border border-line px-2 py-0.5 text-[9px] font-semibold uppercase text-fg-muted">
              {item.role === "SELLER" ? "Selling" : "Buying"}
            </span>
          </div>
          <div className={`mt-1 text-xs font-medium ${complete ? "text-success" : "text-primary"}`}>
            {STATUS_LABEL[item.status]}
          </div>
          <div className="mt-1 text-[11px] text-fg-dim">
            Updated {dateFmt.format(item.updatedAt)}
          </div>
        </div>
      </div>
      <Link
        href={`/dashboard/auction/${item.auctionId}/delivery`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-fg-muted hover:border-primary hover:text-primary"
      >
        Track delivery <Icon name="chevron" size={14} />
      </Link>
    </article>
  );
}
