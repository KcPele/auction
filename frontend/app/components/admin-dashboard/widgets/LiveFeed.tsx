"use client";
import { useState } from "react";
import { useActivityFeed } from "@/app/components/admin/hooks/use-admin-dashboard";
import type { ActivityFeedItem } from "@/app/components/admin/types/dashboard.types";
import { timeAgo } from "@/app/components/notifications/utils/relative-time";
import { Card, CardBody, CardHead } from "./Card";
import { fmtNGN } from "../utils";

type FeedFilter = "all" | "bid" | "win" | "pay" | "notification";

const TYPE_LABEL: Record<string, string> = {
  bid: "bid placed",
  win: "auction won",
  pay: "payment cleared",
  alert: "system alert",
  notification: "notification sent",
};

const DOT_COLOR: Record<string, string> = {
  bid: "bg-accent",
  win: "bg-green",
  pay: "bg-blue",
  alert: "bg-red",
  notification: "bg-fg-dim",
};

const FILTERS: FeedFilter[] = ["all", "bid", "win", "pay", "notification"];

export function LiveFeed() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [paused, setPaused] = useState(false);

  const { data, isLoading, isError, refetch } = useActivityFeed({
    limit: 40,
    type: filter === "all" ? undefined : filter,
  });

  const items: ActivityFeedItem[] = paused ? [] : data ?? [];

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
              {!paused && (
                <span className="h-1.5 w-1.5 rounded-full bg-red animate-pulse-dot" />
              )}
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
                    filter === f
                      ? "bg-surface-2 text-accent"
                      : "text-fg-dim hover:text-fg"
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
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Loading…
            </div>
          ) : isError ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Could not load feed.{" "}
              <button onClick={() => refetch()} className="text-accent">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              {paused ? "Feed paused" : `No ${filter} events`}
            </div>
          ) : (
            items.map((it) => {
              const dot = DOT_COLOR[it.type] ?? "bg-fg-dim";
              const lbl = it.label || TYPE_LABEL[it.type] || it.type;
              return (
                <div
                  key={it.id}
                  className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-3 border-b border-line px-3.5 py-2.5 text-[13px] sm:px-[18px]"
                >
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                  <div className="min-w-0">
                    <div className="font-medium text-fg">
                      <strong className="font-mono font-semibold text-accent-2">
                        {it.handle}
                      </strong>
                      <span className="text-fg-muted"> · {lbl}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-fg-dim">
                      {timeAgo(it.ts)}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[13px] font-semibold tabular-nums">
                    {it.amount !== null ? fmtNGN(it.amount) : ""}
                  </div>
                  <div className="hidden w-11 text-right font-mono text-[10px] text-fg-dim sm:block">
                    {timeAgo(it.ts)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
