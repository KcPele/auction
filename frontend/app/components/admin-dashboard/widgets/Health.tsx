"use client";
import { useSystemHealth } from "@/app/components/admin/hooks/use-admin-dashboard";
import { Card, CardBody, CardHead } from "./Card";

const DOT: Record<string, string> = {
  ok: "bg-green shadow-[0_0_6px_rgba(78,168,92,0.5)]",
  warn: "bg-[#f5b13f]",
  err: "bg-red",
};

export function Health() {
  const { data, isLoading } = useSystemHealth();
  const services = data ?? [];

  return (
    <Card>
      <CardHead title="System health" />
      <CardBody>
        {isLoading ? (
          <div className="py-4 text-center text-sm text-fg-dim">Loading…</div>
        ) : services.length === 0 ? (
          <div className="py-4 text-center text-sm text-fg-dim">No data</div>
        ) : (
          services.map((h) => (
            <div
              key={h.name}
              className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
            >
              <div className="text-[13px]">{h.name}</div>
              <div className="flex items-center gap-2 font-mono text-xs text-fg-muted">
                <span>{h.latency !== undefined ? `${h.latency}ms` : h.status}</span>
                <span
                  className={`h-[7px] w-[7px] rounded-full ${DOT[h.status] ?? DOT.warn}`}
                />
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
