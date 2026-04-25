"use client";
import { useState } from "react";
import { AdminIcon } from "../primitives/Icon";
import { Card, CardBody, CardHead } from "./Card";
import { INITIAL_APPROVALS } from "../data";
import type { Approval } from "../types";

const KIND_TAG: Record<Approval["kind"], string> = {
  car: "text-accent-2 bg-accent-2/[0.06] border-accent-2/20",
  gadget: "text-[#a2c9ff] bg-[#a2c9ff]/[0.06] border-[#a2c9ff]/20",
};

export function Queue() {
  const [items, setItems] = useState<Approval[]>(INITIAL_APPROVALS);
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  const drop = (id: string) => {
    setRemoving((r) => ({ ...r, [id]: true }));
    setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 300);
  };

  return (
    <Card>
      <CardHead
        title={
          <>
            Listing approvals
            <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
              {items.length} waiting
            </span>
          </>
        }
        action={
          <button
            type="button"
            className="bg-transparent text-xs font-medium text-accent hover:text-accent-2"
          >
            Review queue →
          </button>
        }
      />
      <CardBody flush>
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
            Queue clear. Nothing awaiting review.
          </div>
        ) : (
          items.map((q) => (
            <div
              key={q.id}
              className={`flex items-center gap-3 overflow-hidden border-b border-line px-3.5 py-3 transition-all duration-300 last:border-b-0 sm:px-[18px] ${
                removing[q.id] ? "max-h-0 -translate-x-5 py-0 opacity-0" : ""
              }`}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-line text-[rgba(255,200,140,0.4)]"
                style={{
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.08) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
                }}
              >
                <AdminIcon name={q.kind === "car" ? "car" : "phone"} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TAG[q.kind]}`}
                  >
                    {q.kind}
                  </span>
                  {q.tag && (
                    <span className="inline-flex items-center rounded border border-red/25 bg-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red">
                      {q.tag}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-fg-dim">waited {q.waited}</span>
                </div>
                <div className="text-[13px] font-medium">{q.title}</div>
                <div className="text-[11px] text-fg-dim">
                  {q.by} · {q.mechanic || q.proof}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="rounded-[5px] border border-line bg-transparent px-2.5 py-1 text-[11px] font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg"
                  onClick={() => alert(`Review ${q.title}`)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="rounded-[5px] border border-green/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/10"
                  onClick={() => drop(q.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-[5px] border border-red/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10"
                  onClick={() => drop(q.id)}
                >
                  Deny
                </button>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
