"use client";
import Link from "next/link";
import { useAuctions } from "@/app/components/auctions/hooks/use-auctions";
import type { Auction } from "@/app/components/auctions/types/auction.types";
import { useMyBids } from "@/app/components/users/hooks/use-users";
import type { UserBid } from "@/app/components/users/types/users.types";
import { Icon } from "../primitives/Icon";
import { WalletHero } from "../widgets/WalletHero";
import { Countdown } from "../widgets/Countdown";
import { SectionHeader } from "../widgets/SectionHeader";
import { fmtNaira } from "../utils";

const CATEGORIES: Array<{
  id: "cars" | "gadgets";
  label: string;
  icon: "car" | "phone";
}> = [
  { id: "cars", label: "Cars", icon: "car" },
  { id: "gadgets", label: "Gadgets", icon: "phone" },
];

const TILE_MEDIA_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 10px, rgba(255,170,90,0.07) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
};

const ROW_THUMB_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.07) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
};

export function HomeScreen() {
  const live = useAuctions({ status: "LIVE", limit: 12 });
  const upcoming = useAuctions({ status: "SCHEDULED", limit: 6 });
  const active = useMyBids({ status: "ACTIVE", limit: 5 });

  const liveAuctions = live.data ?? [];
  const openingSoon = upcoming.data ?? [];
  const myActive = active.data?.items ?? [];

  return (
    <>
      <h1 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight">
        Auctions
      </h1>

      <WalletHero />

      <div className="my-3 mt-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" />{" "}
            Live now
          </div>
          <div className="text-xs text-fg-dim">
            {liveAuctions.length} auction{liveAuctions.length === 1 ? "" : "s"}{" "}
            running
          </div>
        </div>
        <Link
          href="/dashboard/browse"
          className="text-xs font-medium text-accent"
        >
          See all →
        </Link>
      </div>

      <div className="-mx-[18px] flex gap-3 overflow-x-auto px-[18px] pb-1.5 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {live.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : liveAuctions.length === 0 ? (
          <div className="py-6 text-sm text-fg-dim">No live auctions yet.</div>
        ) : (
          liveAuctions.map((a) => <LiveCard key={a.id} a={a} />)
        )}
      </div>

      {myActive.length > 0 && (
        <>
          <SectionHeader
            title="Your bids"
            sub={`${myActive.length} active`}
            allHref="/dashboard/bids"
            allLabel="All →"
          />
          <div className="rounded-[14px] border border-line bg-surface p-3.5">
            {myActive.slice(0, 3).map((b) => (
              <BidRow
                key={`${b.auctionId}-${b.bidAmount}-${b.status}-${b.endsAt.getTime()}`}
                b={b}
              />
            ))}
          </div>
        </>
      )}

      <SectionHeader title="Browse by category" />
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/browse?cat=${c.id}`}
            className="block rounded-[14px] border border-line bg-surface p-4 text-left"
          >
            <div className="mb-2 text-accent">
              <Icon name={c.icon} size={28} />
            </div>
            <div className="text-sm font-semibold">{c.label}</div>
            <div className="text-[11px] text-fg-dim">Tap to browse</div>
          </Link>
        ))}
      </div>

      <SectionHeader
        title="Opening soon"
        allHref="/dashboard/browse"
        allLabel="All →"
      />
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {upcoming.isLoading ? (
          <div className="py-3 text-center text-sm text-fg-dim">Loading…</div>
        ) : openingSoon.length === 0 ? (
          <div className="py-3 text-center text-sm text-fg-dim">
            Nothing scheduled.
          </div>
        ) : (
          openingSoon.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/auction/${a.id}`}
              className="grid w-full cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-3 text-left text-fg last:border-b-0"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-[rgba(255,200,140,0.4)]"
                style={ROW_THUMB_BG}
              >
                {a.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photoUrl} alt={a.title} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <Icon name={a.category === "cars" ? "car" : "phone"} size={22} />
                )}
              </div>
              <div>
                <div className="text-[13px] font-medium">{a.title}</div>
                <div className="text-[11px] text-fg-dim">
                  Opens in <Countdown target={a.startTime.getTime()} compact />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-[0.08em] text-fg-dim">
                  Starts at
                </div>
                <div className="font-mono text-[13px] font-semibold tabular-nums text-accent-light">
                  {fmtNaira(a.basePrice)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

function LiveCard({ a }: { a: Auction }) {
  return (
    <Link
      href={`/dashboard/auction/${a.id}`}
      className="block w-[230px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[14px] border border-line bg-surface text-left text-fg"
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center text-[rgba(255,200,140,0.3)]"
        style={TILE_MEDIA_BG}
      >
        {a.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.photoUrl} alt={a.title} className="h-full w-full object-cover" />
        ) : (
          <Icon name={a.category === "cars" ? "car" : "phone"} size={46} />
        )}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[5px] border border-red/30 bg-red/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-red">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" />{" "}
          Live
        </span>
      </div>
      <div className="p-2.5">
        <div className="mb-[3px] truncate text-[12px] font-semibold">
          {a.title}
        </div>
        <div className="font-mono text-[13px] font-semibold tabular-nums text-accent-light">
          {fmtNaira(a.basePrice)}
        </div>
        <div className="text-[11px] text-fg-dim">
          <Countdown target={a.endTime.getTime()} compact />
        </div>
      </div>
    </Link>
  );
}

function BidRow({ b }: { b: UserBid }) {
  return (
    <Link
      href={`/dashboard/auction/${b.auctionId}`}
      className="grid grid-cols-[1fr_auto] items-center border-b border-line py-2.5 last:border-b-0"
    >
      <div>
        <div className="text-[13px] font-medium">{b.title}</div>
        <div className="text-[11px] text-fg-dim">
          Your bid {fmtNaira(b.bidAmount)}
        </div>
      </div>
      <div
        className={`text-[10px] font-semibold uppercase ${
          b.status === "leading"
            ? "text-green"
            : b.status === "won"
              ? "text-accent"
              : "text-red"
        }`}
      >
        {b.status}
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="w-[230px] flex-shrink-0 overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="aspect-[4/3] animate-pulse bg-surface-2" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
