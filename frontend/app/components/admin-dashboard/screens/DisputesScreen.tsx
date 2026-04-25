"use client";
import { useState } from "react";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { SectionHeader } from "./SectionHeader";
import { fmtNGN } from "../utils";

type Status = "open" | "investigating" | "resolved";

interface Dispute {
  id: string;
  buyer: string;
  seller: string;
  ref: string;
  amt: number;
  reason: string;
  age: string;
  status: Status;
}

const INITIAL: Dispute[] = [
  { id: "DSP-118", buyer: "ada.o", seller: "autopearl", ref: "AUC-4390", amt: 6_120_000, reason: "Vehicle condition mismatch", age: "2d", status: "open" },
  { id: "DSP-117", buyer: "kc.p", seller: "tunde.k", ref: "AUC-4382", amt: 1_305_000, reason: "Late delivery, no comms", age: "5d", status: "investigating" },
  { id: "DSP-116", buyer: "nkem_a", seller: "emeka_b", ref: "AUC-4377", amt: 780_000, reason: "Wrong color shipped", age: "1w", status: "open" },
  { id: "DSP-115", buyer: "femi_ola", seller: "zee__", ref: "AUC-4351", amt: 2_340_000, reason: "Battery health below listed", age: "2w", status: "resolved" },
];

const STATUS_STYLE: Record<Status, string> = {
  open: "border-red/30 bg-red/[0.08] text-red",
  investigating: "border-accent/30 bg-accent/10 text-accent",
  resolved: "border-green/30 bg-green/[0.08] text-green",
};

const FILTERS: (Status | "all")[] = ["all", "open", "investigating", "resolved"];

export function DisputesScreen() {
  const [items, setItems] = useState<Dispute[]>(INITIAL);
  const [filter, setFilter] = useState<Status | "all">("all");

  const advance = (id: string) =>
    setItems((s) =>
      s.map((d) =>
        d.id === id
          ? {
              ...d,
              status:
                d.status === "open"
                  ? "investigating"
                  : d.status === "investigating"
                    ? "resolved"
                    : "resolved",
            }
          : d,
      ),
    );

  const visible = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <>
      <SectionHeader
        title="Disputes & chargebacks"
        sub="Open cases. Review ledger history, communicate with both parties, and resolve against the record."
      />
      <Card>
        <CardHead
          title={`Cases · ${visible.length}`}
          controls={
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] capitalize ${
                    filter === f
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />
        <CardBody flush>
          <ul className="divide-y divide-line">
            {visible.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3.5 sm:px-[18px]">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-fg-muted">{d.id}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[d.status]}`}
                    >
                      {d.status}
                    </span>
                    <span className="text-[11px] text-fg-dim">· {d.age} ago</span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{d.reason}</div>
                  <div className="mt-0.5 text-xs text-fg-muted">
                    @{d.buyer} vs @{d.seller} · {d.ref} · {fmtNGN(d.amt)}
                  </div>
                </div>
                {d.status !== "resolved" && (
                  <button
                    type="button"
                    onClick={() => advance(d.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-[11px] font-medium text-fg-muted hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                  >
                    {d.status === "open" ? "Start review" : "Mark resolved"}
                  </button>
                )}
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-[18px] py-8 text-center text-xs text-fg-muted">No cases.</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
