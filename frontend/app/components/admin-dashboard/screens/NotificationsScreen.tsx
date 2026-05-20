"use client";
import { useState } from "react";
import {
  useInAppNotifications,
  useNotificationLogs,
} from "@/app/components/admin/hooks/use-admin-extras";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: "text-green",
  FAILED: "text-red",
  QUEUED: "text-accent",
  PENDING: "text-accent",
  SENT: "text-green",
};

const CHANNEL_BG: Record<string, string> = {
  EMAIL: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
  WHATSAPP: "bg-green/[0.12] text-green",
  SMS: "bg-accent/[0.12] text-accent",
  PUSH: "bg-surface-2 text-fg-muted",
};

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const CHANNEL_OPTS = ["all", "EMAIL", "WHATSAPP", "SMS", "PUSH"];
const STATUS_OPTS = ["all", "DELIVERED", "FAILED", "QUEUED"];

export function NotificationsScreen() {
  const [channel, setChannel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading, isError, refetch } = useNotificationLogs({
    channel: channel === "all" ? undefined : channel,
    status: status === "all" ? undefined : status,
  });
  const inApp = useInAppNotifications();

  const items = data ?? [];
  const inAppItems = inApp.data ?? [];
  const failed = items.filter((i) => i.status === "FAILED").length;

  return (
    <>
      <SectionHeader
        title="Notifications log"
        sub="In-app notifications from the database, plus external delivery status when providers log it."
      />
      <Card className="mb-4">
        <CardHead
          title={
            <>
              In-app notifications
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {inAppItems.length} recent
              </span>
            </>
          }
        />
        <CardBody flush>
          {inApp.isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Loading…
            </div>
          ) : inApp.isError ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Could not load.{" "}
              <button onClick={() => inApp.refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : inAppItems.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No in-app notifications yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    {["Time", "Audience", "Recipient", "Type", "Message"].map(
                      (h) => (
                        <th
                          key={h}
                          className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {inAppItems.map((n) => (
                    <tr key={n.id} className="hover:bg-surface-2/40">
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                        {dateFmt.format(new Date(n.createdAt))}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[11px] font-semibold uppercase text-accent sm:px-[18px]">
                        {n.audience}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                        {n.recipient}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                        {n.type}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                        <div className="font-medium">{n.title}</div>
                        <div className="mt-0.5 text-xs text-fg-muted">
                          {n.message}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHead
          title={
            <>
              External delivery logs
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {items.length} entries · {failed} failed
              </span>
            </>
          }
          controls={
            <div className="flex flex-wrap gap-1.5">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
              >
                {CHANNEL_OPTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
              >
                {STATUS_OPTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <CardBody flush>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Loading…
            </div>
          ) : isError ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Could not load.{" "}
              <button onClick={() => refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No deliveries logged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    {["Time", "Channel", "Recipient", "Template", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((n) => (
                    <tr key={n.id} className="hover:bg-surface-2/40">
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                        {dateFmt.format(new Date(n.createdAt))}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${CHANNEL_BG[n.channel] ?? CHANNEL_BG.PUSH}`}
                        >
                          {n.channel}
                        </span>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                        {n.recipient}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                        {n.template}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <div
                          className={`text-[11px] font-semibold uppercase ${STATUS_STYLE[n.status] ?? "text-fg-muted"}`}
                        >
                          {n.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
