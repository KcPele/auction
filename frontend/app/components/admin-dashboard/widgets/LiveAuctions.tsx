"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHead } from "./Card";
import { INITIAL_AUCTIONS, INITIAL_COUNTS } from "../data";
import { fmtNGN, fmtDuration } from "../utils";
import type { AdminAuction } from "../types";

export function LiveAuctions() {
  const [auctions, setAuctions] = useState<AdminAuction[]>(INITIAL_AUCTIONS);

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
            <button
              type="button"
              key={a.id}
              className="block w-full cursor-pointer border-b border-line px-3.5 py-3 text-left last:border-b-0 hover:bg-accent/[0.03] sm:px-[18px]"
              onClick={() => alert(`${a.title} · ${fmtNGN(a.bid)} · ${fmtDuration(a.endSec)}`)}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[13px] font-medium">{a.title}</div>
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
              <div className="flex justify-between text-[11px] text-fg-dim">
                <span>
                  {a.bidders} bidders · {a.holdPct}% hold
                </span>
                <span className="font-mono font-semibold text-fg">{fmtNGN(a.bid)}</span>
              </div>
            </button>
          );
        })}
      </CardBody>
    </Card>
  );
}
