"use client";
import { useState } from "react";
import { SectionHeader } from "./SectionHeader";

interface HealthRow {
  name: string;
  val: string;
  status: "ok" | "warn" | "error";
  note: string;
}

const MOCK_HEALTH: HealthRow[] = [
  { name: "Strowallet webhook", val: "180ms", status: "ok", note: "Payment processing healthy." },
  { name: "WhatsApp Business API", val: "98% deliv", status: "ok", note: "Delivery rate healthy across both car and gadget campaigns." },
  { name: "Resend (email)", val: "99.4% deliv", status: "ok", note: "All transactional email queues clear." },
  { name: "Redis · bid queue", val: "14 jobs", status: "ok", note: "BullMQ processing normally. No stuck jobs." },
  { name: "PostgreSQL primary", val: "12ms p95", status: "ok", note: "Connection pool 24/100. No long-running queries." },
  { name: "Socket.IO gateway", val: "1,284 peers", status: "ok", note: "Live bid broadcast operating normally." },
];

function statusDot(status: HealthRow["status"]) {
  const colors = { ok: "bg-green", warn: "bg-amber", error: "bg-red" };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />;
}

export function HealthScreen() {
  // Integration: GET /api/v1/admin/health
  const [rows] = useState<HealthRow[]>(MOCK_HEALTH);

  const okCount = rows.filter((r) => r.status === "ok").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;

  return (
    <>
      <SectionHeader
        title="System health"
        sub="Real-time status of platform infrastructure and third-party integrations."
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-green">{okCount}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Healthy</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-amber">{warnCount}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Warnings</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <div className="font-mono text-[24px] font-bold text-fg">{rows.length}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">Total checks</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.name} className="rounded-[14px] border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusDot(r.status)}
                <span className="text-[13px] font-medium">{r.name}</span>
              </div>
              <span className="font-mono text-xs text-fg-muted">{r.val}</span>
            </div>
            <div className="mt-1 text-[11px] text-fg-dim pl-4">{r.note}</div>
          </div>
        ))}
      </div>
    </>
  );
}
