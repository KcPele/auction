"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMyBids } from "@/app/components/users/hooks/use-users";
import type { UserBid } from "@/app/components/users/types/users.types";
import { fmtNaira } from "../utils";
import { Icon } from "../primitives/Icon";
import { Countdown } from "../widgets/Countdown";

type TabId = "active" | "scheduled" | "won";

const ROW_THUMB_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.07) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
};

const STATUS_LABEL: Record<UserBid["status"], string> = {
  leading: "Leading",
  outbid: "Outbid",
  won: "Won",
};

const STATUS_COLOR: Record<UserBid["status"], string> = {
  leading: "text-green",
  outbid: "text-red",
  won: "text-accent",
};

export function MyBidsScreen() {
  const [tab, setTab] = useState<TabId>("active");

  const status =
    tab === "active" ? "ACTIVE" : tab === "scheduled" ? "SCHEDULED" : "WON";
  const { data, isLoading, isError, refetch } = useMyBids({
    status,
    limit: 50,
  });
  const items = useMemo(() => data?.items ?? [], [data]);

  // Counts come from the same endpoint per-tab — refetch each tab.
  // Lightweight: kick off the other counts via small queries.
  const activeCount = useMyBids({ status: "ACTIVE", limit: 1 }).data?.total ?? 0;
  const scheduledCount =
    useMyBids({ status: "SCHEDULED", limit: 1 }).data?.total ?? 0;
  const wonCount = useMyBids({ status: "WON", limit: 1 }).data?.total ?? 0;

  const firstOutbid = items.find((b) => b.status === "outbid");

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        My bids
      </h1>

      <div className="my-3 grid auto-cols-fr grid-flow-col rounded-[10px] border border-line bg-surface p-[3px]">
        {(
          [
            { id: "active", label: "Active", count: activeCount },
            { id: "scheduled", label: "Scheduled", count: scheduledCount },
            { id: "won", label: "Won", count: wonCount },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[7px] border-none px-1.5 py-2 text-center text-[12px] ${
              tab === t.id
                ? "bg-accent/[0.12] font-semibold text-accent"
                : "bg-transparent font-medium text-fg-muted"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="rounded bg-white/[0.04] px-1.5 py-px font-mono text-[10px]">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "active" && firstOutbid && (
        <div className="mb-3 rounded-[14px] border border-red/20 bg-red/[0.06] p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="text-red">
              <Icon name="flame" size={18} />
            </div>
            <div className="flex-1 text-[13px]">
              You&apos;ve been outbid on{" "}
              <strong>{firstOutbid.title}</strong>
            </div>
            <Link
              href={`/dashboard/auction/${firstOutbid.auctionId}`}
              className="text-xs font-semibold text-red"
            >
              Raise →
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-fg-dim">Loading…</div>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-fg-dim">Could not load bids.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-xs text-accent"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-fg-dim">Nothing here yet.</div>
        ) : (
          items.map((b) => <Row key={b.auctionId} b={b} />)
        )}
      </div>
    </>
  );
}

function Row({ b }: { b: UserBid }) {
  return (
    <Link
      href={`/dashboard/auction/${b.auctionId}`}
      className="grid w-full cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-3 text-left text-fg last:border-b-0"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-[rgba(255,200,140,0.4)]"
        style={ROW_THUMB_BG}
      >
        {b.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.photoUrl} alt={b.title} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <Icon name={b.category === "cars" ? "car" : "phone"} size={22} />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{b.title}</div>
        <div className="text-[11px] text-fg-dim">
          Your bid {fmtNaira(b.bidAmount)} · top {fmtNaira(b.currentHighBid)}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[10px] font-semibold uppercase ${STATUS_COLOR[b.status]}`}>
          {STATUS_LABEL[b.status]}
        </div>
        <div className="font-mono text-[11px] text-fg-dim">
          <Countdown target={b.endsAt.getTime()} compact />
        </div>
      </div>
    </Link>
  );
}
