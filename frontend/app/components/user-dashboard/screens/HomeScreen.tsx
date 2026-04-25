import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { WalletHero } from "../widgets/WalletHero";
import { AuctionTile } from "../widgets/AuctionTile";
import { BidRow } from "../widgets/BidRow";
import { Countdown } from "../widgets/Countdown";
import { SectionHeader } from "../widgets/SectionHeader";
import { AUCTIONS, MY_BIDS } from "../data";
import { fmtNaira } from "../utils";

const CATEGORIES: Array<{ id: "cars" | "gadgets"; label: string; sub: string; icon: "car" | "phone" }> = [
  { id: "cars", label: "Cars", sub: "18 live · 42 opening", icon: "car" },
  { id: "gadgets", label: "Gadgets", sub: "63 live · 128 opening", icon: "phone" },
];

const ROW_THUMB_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.07) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
};

export function HomeScreen() {
  // Integration: fetch from GET /api/v1/auctions?status=LIVE
  // Integration: fetch wallet from GET /api/v1/wallets/me
  // Integration: fetch user from GET /api/v1/users/me
  const liveAuctions = AUCTIONS.filter((a) => a.live);
  const myActive = MY_BIDS.filter((b) => b.status === "leading" || b.status === "outbid");
  const openingSoon = AUCTIONS.filter((a) => !a.live).slice(0, 3);

  return (
    <>
      <h1 className="m-0 mt-1 font-display text-[26px] font-semibold tracking-tight">
        Auctions
      </h1>

      <WalletHero />

      <div className="my-3 mt-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" /> Live now
          </div>
          <div className="text-xs text-fg-dim">{liveAuctions.length} auctions closing soon</div>
        </div>
        <Link href="/dashboard/browse" className="text-xs font-medium text-accent">
          See all →
        </Link>
      </div>
      <div className="-mx-[18px] flex gap-3 overflow-x-auto px-[18px] pb-1.5 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {liveAuctions.map((a) => (
          <AuctionTile key={a.id} a={a} />
        ))}
      </div>

      <SectionHeader
        title="Your bids"
        sub={`${myActive.length} active · 2 need attention`}
        allHref="/dashboard/bids"
        allLabel="All →"
      />
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {myActive.slice(0, 3).map((b) => (
          <BidRow key={b.id} bid={b} auction={AUCTIONS.find((x) => x.id === b.id)} />
        ))}
      </div>

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
            <div className="text-[11px] text-fg-dim">{c.sub}</div>
          </Link>
        ))}
      </div>

      <SectionHeader title="Opening soon" allHref="/dashboard/browse" allLabel="All →" />
      <div className="rounded-[14px] border border-line bg-surface p-3.5">
        {openingSoon.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/auction/${a.id}`}
            className="grid w-full cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-3 text-left text-fg last:border-b-0"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-[rgba(255,200,140,0.4)]"
              style={ROW_THUMB_BG}
            >
              <Icon name={a.cat === "cars" ? "car" : "phone"} size={22} />
            </div>
            <div>
              <div className="text-[13px] font-medium">{a.title}</div>
              <div className="text-[11px] text-fg-dim">
                Opens in <Countdown endsIn={a.endsIn} compact />
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.08em] text-fg-dim">Starts at</div>
              <div className="font-mono text-[13px] font-semibold tabular-nums text-accent-light">
                {fmtNaira(a.start)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
