"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/app/components/notifications/hooks/use-notifications";
import type {
  Notification,
  NotificationKind,
} from "@/app/components/notifications/types/notification.types";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Icon, type IconName } from "../primitives/Icon";
import { Chips, type ChipOption } from "../widgets/Chips";
import { PaginationControls } from "../../ui/PaginationControls";

type Filter = "all" | NotificationKind;

const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All" },
  { id: "bid", label: "Bids" },
  { id: "listing", label: "Listings" },
  { id: "payment", label: "Payments" },
  { id: "system", label: "System" },
];

const ICON_FOR: Record<NotificationKind, IconName> = {
  bid: "gavel",
  listing: "tag",
  payment: "wallet",
  system: "bell",
};

const ICON_BG: Record<NotificationKind, string> = {
  bid: "bg-info-soft text-info",
  listing: "bg-primary-soft text-primary",
  payment: "bg-warning-soft text-warning",
  system: "bg-surface-subtle text-fg-muted",
};

function notificationHref(notification: Notification): string | null {
  const directHref = notification.data?.href;
  if (
    directHref === "/dashboard/wallet" ||
    directHref === "/dashboard/wallet/withdrawals"
  ) {
    return directHref;
  }
  const auctionId = notification.data?.auctionId;
  if (typeof auctionId === "string") {
    return `/dashboard/auction/${encodeURIComponent(auctionId)}`;
  }
  const listingId = notification.data?.listingId;
  const listingCategory = notification.data?.category;
  if (
    typeof listingId === "string" &&
    (listingCategory === "CAR" || listingCategory === "GADGET")
  ) {
    const category = listingCategory === "CAR" ? "cars" : "gadgets";
    return `/dashboard/listings/${encodeURIComponent(listingId)}?category=${category}`;
  }
  if (typeof notification.data?.applicationId === "string") {
    return "/dashboard/listing-access";
  }
  const conversationId = notification.data?.conversationId;
  if (typeof conversationId === "string") {
    return `/dashboard/support?c=${encodeURIComponent(conversationId)}`;
  }
  return null;
}

export function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const { data, isLoading, isError, refetch } = useNotifications({
    limit: pageSize,
    offset: page * pageSize,
    kind: filter === "all" ? undefined : filter,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items: Notification[] = data?.items ?? [];
  const hasUnread = items.some((n) => n.unread);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
          Notifications
        </h1>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs font-medium text-accent hover:text-accent-2 disabled:opacity-60"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-3">
        <Chips
          options={FILTERS}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(0);
          }}
        />
      </div>

      {isLoading ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <FailedState onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (n.unread) markRead.mutate(n.id);
                const href = notificationHref(n);
                if (href) router.push(href);
              }}
              className={`relative grid w-full grid-cols-[36px_1fr_auto] gap-3 border-b border-line py-3.5 text-left ${
                n.unread
                  ? "before:absolute before:-left-2.5 before:top-[22px] before:h-1 before:w-1 before:rounded-full before:bg-accent before:content-['']"
                  : ""
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${ICON_BG[n.kind]}`}
              >
                <Icon name={ICON_FOR[n.kind]} size={17} />
              </div>
              <div>
                <div className="text-[13px] font-medium">{n.title}</div>
                <div className="mt-0.5 text-xs leading-[1.45] text-fg-muted">
                  {n.message}
                </div>
              </div>
              <div className="font-mono text-[10px] text-fg-dim">
                {timeAgo(n.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[36px_1fr_auto] gap-3 border-b border-line py-3.5"
        >
          <div className="h-9 w-9 animate-pulse rounded-[10px] bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
        <Icon name="mail" size={20} />
      </div>
      <div className="text-sm font-medium">You&apos;re all caught up</div>
      <div className="mt-1 text-xs text-fg-muted">
        We&apos;ll let you know as soon as something happens.
      </div>
    </div>
  );
}

function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-12 text-center">
      <div className="text-sm font-medium">Could not load notifications</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 text-xs font-medium text-accent hover:text-accent-2"
      >
        Retry
      </button>
    </div>
  );
}
