"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";

type Channel = "email" | "wa";
type DeliveryStatus = "delivered" | "failed" | "queued";

interface NotifLog {
  id: string;
  time: string;
  to: string;
  channel: Channel;
  template: string;
  status: DeliveryStatus;
  error?: string;
}

const INITIAL: NotifLog[] = [
  { id: "N-9941", time: "15:47:10", to: "+234 812 4471", channel: "wa", template: "outbid_alert", status: "delivered" },
  { id: "N-9940", time: "15:46:22", to: "ada@gmail.com", channel: "email", template: "win_confirmation", status: "delivered" },
  { id: "N-9939", time: "15:45:01", to: "+234 905 7711", channel: "wa", template: "payment_reminder", status: "failed", error: "Recipient opted out" },
  { id: "N-9938", time: "15:44:33", to: "tunde@hotmail.com", channel: "email", template: "kyc_complete", status: "delivered" },
  { id: "N-9937", time: "15:44:02", to: "femi@yahoo.com", channel: "email", template: "settlement_payout", status: "queued" },
  { id: "N-9936", time: "15:43:18", to: "+234 700 9912", channel: "wa", template: "auction_starting", status: "failed", error: "Number not on WhatsApp" },
];

const STATUS_STYLE: Record<DeliveryStatus, string> = {
  delivered: "text-green",
  failed: "text-red",
  queued: "text-accent",
};

const CHANNEL_BG: Record<Channel, string> = {
  email: "bg-[rgba(107,176,255,0.12)] text-[var(--blue,#6bb0ff)]",
  wa: "bg-green/[0.12] text-green",
};

export function NotificationsScreen() {
  const [items, setItems] = useState<NotifLog[]>(INITIAL);

  const retry = (id: string) =>
    setItems((s) => s.map((n) => (n.id === id ? { ...n, status: "queued", error: undefined } : n)));

  const failed = items.filter((i) => i.status === "failed").length;

  return (
    <>
      <SectionHeader
        title="Notifications log"
        sub="Email (Resend) and WhatsApp (Business API) delivery status. Inspect failed deliveries, re-queue retries."
      />
      <Card>
        <CardHead
          title={
            <>
              Recent deliveries
              <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
                {items.length} entries · {failed} failed
              </span>
            </>
          }
        />
        <CardBody flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  {["Time", "Channel", "Recipient", "Template", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="border-b border-line bg-bg-1 px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id} className="hover:bg-surface-2/40">
                    <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                      {n.time}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${CHANNEL_BG[n.channel]}`}
                      >
                        {n.channel === "wa" ? "WhatsApp" : "Email"}
                      </span>
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-[13px] sm:px-[18px]">
                      {n.to}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 font-mono text-xs text-fg-muted sm:px-[18px]">
                      {n.template}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                      <div className={`text-[11px] font-semibold uppercase ${STATUS_STYLE[n.status]}`}>
                        {n.status}
                      </div>
                      {n.error && <div className="mt-0.5 text-[11px] text-fg-dim">{n.error}</div>}
                    </td>
                    <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                      {n.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => retry(n.id)}
                          className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-accent/40 hover:text-accent"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
