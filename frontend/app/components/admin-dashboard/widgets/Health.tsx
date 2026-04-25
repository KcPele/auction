import { Card, CardBody, CardHead } from "./Card";
import { INITIAL_HEALTH } from "../data";
import type { HealthStatus } from "../types";

const DOT: Record<HealthStatus, string> = {
  ok: "bg-green shadow-[0_0_6px_rgba(78,168,92,0.5)]",
  warn: "bg-[#f5b13f]",
  err: "bg-red",
};

export function Health() {
  return (
    <Card>
      <CardHead title="System health" />
      <CardBody>
        {INITIAL_HEALTH.map((h) => (
          <div
            key={h.name}
            className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
          >
            <div className="text-[13px]">{h.name}</div>
            <div className="flex items-center gap-2 font-mono text-xs text-fg-muted">
              <span>{h.val}</span>
              <span className={`h-[7px] w-[7px] rounded-full ${DOT[h.status]}`} />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
