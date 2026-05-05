"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHead } from "./Card";
import { Modal } from "../../ui/Modal";
import { INITIAL_AUCTIONS, INITIAL_COUNTS } from "../data";
import { fmtNGN, fmtDuration } from "../utils";
import type { AdminAuction } from "../types";

export function LiveAuctions() {
  const [auctions, setAuctions] = useState<AdminAuction[]>(INITIAL_AUCTIONS);
  const [cancelling, setCancelling] = useState<AdminAuction | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setAuctions((list) =>
        list.map((a) => ({ ...a, endSec: Math.max(0, a.endSec - 1), elapsed: a.elapsed + 1 })),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setAuctions((list) => {
        if (list.length === 0) return list;
        const idx = Math.floor(Math.random() * list.length);
        const target = list[idx];
        const bump = Math.round(target.bid * (Math.random() * 0.015 + 0.005));
        return list.map((a, i) =>
          i === idx ? { ...a, bid: a.bid + bump, bidders: a.bidders + 1 } : a,
        );
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHead
        title={
          <>
            Live auctions
            <span className="ml-1.5 text-[11px] font-normal text-fg-dim">
              {auctions.length} of {INITIAL_COUNTS.auctions} shown
            </span>
          </>
        }
        action={
          <button
            type="button"
            className="bg-transparent text-xs font-medium text-accent hover:text-accent-2"
          >
            Monitor all →
          </button>
        }
      />
      <CardBody flush>
        {auctions.map((a) => {
          const progress = Math.min(100, (a.elapsed / a.totalSec) * 100);
          return (
            <div
              key={a.id}
              className="border-b border-line px-3.5 py-3 last:border-b-0 hover:bg-accent/[0.03] sm:px-[18px]"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{a.title}</div>
                <div className="font-mono text-[11px] font-semibold text-accent-2">
                  ⏱ {fmtDuration(a.endSec)}
                </div>
              </div>
              <div className="my-1.5 h-1 overflow-hidden rounded bg-white/[0.04]">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-dim">
                <span>
                  {a.bidders} bidders · {a.holdPct}% hold
                </span>
                <span className="font-mono font-semibold text-fg">{fmtNGN(a.bid)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCancelling(a)}
                  className="rounded-md border border-red/30 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10"
                >
                  Cancel auction
                </button>
              </div>
            </div>
          );
        })}
      </CardBody>

      <Modal
        open={!!cancelling}
        onClose={() => {
          setCancelling(null);
          setCancelReason("");
        }}
        title={cancelling ? `Cancel · ${cancelling.title}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setCancelling(null);
                setCancelReason("");
              }}
              className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              Keep running
            </button>
            <button
              type="button"
              onClick={() => {
                // Integration: POST /api/v1/auctions/{id}/cancel { reason }
                console.log("cancel", { id: cancelling?.id, reason: cancelReason });
                setAuctions((list) => list.filter((x) => x.id !== cancelling?.id));
                setCancelling(null);
                setCancelReason("");
              }}
              className="rounded-md border border-red/30 bg-red/[0.08] px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15"
            >
              Confirm cancel
            </button>
          </>
        }
      >
        <p className="mb-4 text-[13px] text-fg-muted">
          Cancelling releases all bidder holds. This cannot be undone. State a reason for the
          audit log.
        </p>
        <label className="block text-xs font-medium text-fg-muted">Reason</label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          placeholder="e.g. Listing issue surfaced after start."
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent placeholder:text-fg-dim"
        />
      </Modal>
    </Card>
  );
}
