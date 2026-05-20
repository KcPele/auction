"use client";
import { useMemo, useState } from "react";
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

type Filter = "all" | NotificationKind;

const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All" },
  { id: "bid", label: "Bids" },
  { id: "alert", label: "Alerts" },
  { id: "wa", label: "WhatsApp" },
  { id: "email", label: "Email" },
];

const ICON_FOR: Record<NotificationKind, IconName> = {
  email: "mail",
  wa: "wa",
  bid: "gavel",
  alert: "flame",
};

const ICON_BG: Record<NotificationKind, string> = {
  email: "bg-accent/[0.12] text-accent",
  wa: "bg-green/[0.12] text-green",
  bid: "bg-[rgba(107,176,255,0.12)] text-[var(--blue)]",
  alert: "bg-red/[0.12] text-red",
};

export function NotificationsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = useMemo<Notification[]>(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((n) => n.kind === filter)),
    [filter, items],
  );
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
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <FailedState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => n.unread && markRead.mutate(n.id)}
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
