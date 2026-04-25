"use client";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "../primitives/Icon";
import { Chips, type ChipOption } from "../widgets/Chips";
import { NOTIFS } from "../data";
import type { NotifKind } from "../types";

type Filter = "all" | NotifKind;

const FILTERS: ChipOption<Filter>[] = [
  { id: "all", label: "All" },
  { id: "bid", label: "Bids" },
  { id: "alert", label: "Alerts" },
  { id: "wa", label: "WhatsApp" },
  { id: "email", label: "Email" },
];

const ICON_FOR: Record<NotifKind, IconName> = {
  email: "mail",
  wa: "wa",
  bid: "gavel",
  alert: "flame",
};

const ICON_BG: Record<NotifKind, string> = {
  email: "bg-accent/[0.12] text-accent",
  wa: "bg-green/[0.12] text-green",
  bid: "bg-[rgba(107,176,255,0.12)] text-[var(--blue)]",
  alert: "bg-red/[0.12] text-red",
};

export function NotificationsScreen() {
  // Integration: fetch from GET /api/v1/notifications?unreadOnly=false&limit=20&offset=0
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState(NOTIFS);
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((n) => n.kind === filter)),
    [filter, items],
  );

  const markRead = (id: number) => {
    // Integration: PATCH /api/v1/notifications/{id}/read
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const markAllRead = () => {
    // Integration: PATCH /api/v1/notifications/read-all
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const hasUnread = items.some((n) => n.unread);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-medium text-accent hover:text-accent-2"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="mt-3">
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="mt-2">
        {filtered.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => markRead(n.id)}
            className={`relative grid w-full grid-cols-[36px_1fr_auto] gap-3 border-b border-line py-3.5 text-left ${
              n.unread
                ? "before:absolute before:-left-2.5 before:top-[22px] before:h-1 before:w-1 before:rounded-full before:bg-accent before:content-['']"
                : ""
            }`}
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${ICON_BG[n.kind]}`}>
              <Icon name={ICON_FOR[n.kind]} size={17} />
            </div>
            <div>
              <div className="text-[13px] font-medium">{n.title}</div>
              <div className="mt-0.5 text-xs leading-[1.45] text-fg-muted">{n.desc}</div>
            </div>
            <div className="font-mono text-[10px] text-fg-dim">{n.time}</div>
          </button>
        ))}
      </div>
    </>
  );
}
