"use client";
import { useSystemHealth } from "@/app/components/admin/hooks/use-admin-dashboard";
import { SectionHeader } from "./SectionHeader";

const DOT: Record<string, string> = {
  ok: "bg-green",
  warn: "bg-amber",
  err: "bg-red",
};

export function HealthScreen() {
  const { data, isLoading, isError, refetch } = useSystemHealth();
  const services = data ?? [];

  const ok = services.filter((s) => s.status === "ok").length;
  const warn = services.filter((s) => s.status === "warn").length;
  const err = services.filter((s) => s.status === "err").length;

  return (
    <>
      <SectionHeader
        title="System health"
        sub="Real-time status of platform infrastructure and third-party integrations."
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat value={ok} label="Healthy" color="text-green" />
        <Stat value={warn} label="Warnings" color="text-amber" />
        <Stat value={err || services.length} label={err ? "Down" : "Total"} color={err ? "text-red" : "text-fg"} />
      </div>

      {isLoading ? (
        <div className="mt-8 text-center text-sm text-fg-dim">Loading…</div>
      ) : isError ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-fg-dim">Could not load.</p>
          <button onClick={() => refetch()} className="mt-2 text-xs text-accent">
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-dim">
          No services reported.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {services.map((r) => (
            <div
              key={r.name}
              className="rounded-[14px] border border-line bg-surface p-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${DOT[r.status] ?? DOT.warn}`}
                  />
                  <span className="text-[13px] font-medium">{r.name}</span>
                </div>
                <span className="font-mono text-xs text-fg-muted">
                  {r.latency !== undefined ? `${r.latency}ms` : r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 text-center">
      <div className={`font-mono text-[24px] font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-fg-dim">
        {label}
      </div>
    </div>
  );
}
