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

export function NotificationsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(
    () => (filter === "all" ? NOTIFS : NOTIFS.filter((n) => n.kind === filter)),
    [filter],
  );
  return (
    <>
      <h1 className="dash-page-title">Notifications</h1>
      <div style={{ marginTop: 12 }}>
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div style={{ marginTop: 8 }}>
        {filtered.map((n) => (
          <div key={n.id} className={`dash-notif-row ${n.unread ? "unread" : ""}`}>
            <div className={`dash-notif-icon ${n.kind}`}>
              <Icon name={ICON_FOR[n.kind]} size={17} />
            </div>
            <div>
              <div className="dash-notif-title">{n.title}</div>
              <div className="dash-notif-desc">{n.desc}</div>
            </div>
            <div className="dash-notif-time">{n.time}</div>
          </div>
        ))}
      </div>
    </>
  );
}
