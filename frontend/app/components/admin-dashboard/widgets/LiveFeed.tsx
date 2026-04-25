"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHead } from "./Card";
import { INITIAL_FEED } from "../data";
import { fmtNGN } from "../utils";
import type { FeedItem, FeedType } from "../types";

const TYPE_LABEL: Record<FeedType, string> = {
  bid: "bid placed",
  win: "auction won",
  pay: "payment cleared",
  alert: "system alert",
};

const DOT_COLOR: Record<FeedType, string> = {
  bid: "bg-accent",
  win: "bg-green",
  pay: "bg-blue",
  alert: "bg-red",
};

const FILTERS: Array<"all" | FeedType> = ["all", "bid", "win", "pay"];

const TEMPLATES: Array<Omit<FeedItem, "id" | "time">> = [
  { type: "bid", user: "olu.m", item: "Honda Civic Type R", amt: 3_200_000 },
  { type: "bid", user: "kemi.a", item: 'iPad Pro 13"', amt: 890_000 },
  { type: "bid", user: "seyi.t", item: "Mercedes GLE 350", amt: 18_400_000 },
  { type: "win", user: "priye.x", item: "Galaxy Z Fold 6", amt: 1_120_000 },
  { type: "pay", user: "jide.o", item: "Toyota RAV4", amt: 12_800_000 },
];

export function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [filter, setFilter] = useState<"all" | FeedType>("all");
  const [paused, setPaused] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const amt = Math.round((t.amt ?? 0) * (1 + Math.random() * 0.03));
      setFeed((f) => [{ ...t, amt, id: "F" + Date.now() + Math.random(), time: "now" }, ...f].slice(0, 40));
      setPulse(true);
      const to = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(to);
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = filter === "all" ? feed : feed.filter((f) => f.type === filter);

  return (
    <Card>
      <CardHead
        title={
          <>
            Live ops feed
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                paused ? "bg-fg-dim/15 text-fg-dim" : "bg-red/10 text-red"
              }`}
            >
              {!paused && <span className="h-1.5 w-1.5 rounded-full bg-red animate-pulse-dot" />}
              {paused ? "PAUSED" : "LIVE"}
            </span>
          </>
        }
        controls={
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-md border border-line bg-bg-1 p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    filter === f ? "bg-surface-2 text-accent" : "text-fg-dim hover:text-fg"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="rounded-md border border-line px-2.5 py-1 text-[11px] font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              {paused ? "▶ Resume" : "❚❚ Pause"}
            </button>
          </div>
        }
      />
      <CardBody flush>
        <div className="max-h-[440px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No {filter} events
            </div>
          ) : (
            filtered.map((it, i) => (
              <div
                key={it.id}
                className={`grid grid-cols-[10px_1fr_auto_auto] items-center gap-3 border-b border-line px-3.5 py-2.5 text-[13px] transition-colors sm:px-[18px] ${
                  i === 0 && pulse ? "bg-accent/5" : ""
                }`}
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_COLOR[it.type]}`} />
                <div className="min-w-0">
                  <div className="font-medium text-fg">
                    <strong className="font-mono font-semibold text-accent-2">@{it.user}</strong>
                    <span className="text-fg-muted"> · {TYPE_LABEL[it.type]} on </span>
                    <span className="text-accent-2">{it.item}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-fg-dim">
                    {it.type === "alert" ? "system" : "BidNaija"} · just happened
                  </div>
                </div>
                <div className="text-right font-mono text-[13px] font-semibold tabular-nums">
                  {it.amt != null ? fmtNGN(it.amt) : ""}
                </div>
                <div className="hidden w-11 text-right font-mono text-[10px] text-fg-dim sm:block">
                  {it.time}
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
