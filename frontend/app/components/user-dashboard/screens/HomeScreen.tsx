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

export function HomeScreen() {
  const liveAuctions = AUCTIONS.filter((a) => a.live);
  const myActive = MY_BIDS.filter((b) => b.status === "leading" || b.status === "outbid");
  const openingSoon = AUCTIONS.filter((a) => !a.live).slice(0, 3);

  return (
    <>
      <h1 className="dash-page-title" style={{ marginTop: 4 }}>
        Auctions
      </h1>

      <WalletHero />

      <div className="dash-section-header">
        <div>
          <div className="dash-section-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="dash-live-dot" /> Live now
          </div>
          <div className="dash-section-sub">{liveAuctions.length} auctions closing soon</div>
        </div>
        <Link href="/dashboard/browse" className="dash-section-all">
          See all →
        </Link>
      </div>
      <div className="dash-auction-scroll">
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
      <div className="dash-card">
        {myActive.slice(0, 3).map((b) => (
          <BidRow key={b.id} bid={b} auction={AUCTIONS.find((x) => x.id === b.id)} />
        ))}
      </div>

      <SectionHeader title="Browse by category" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/browse?cat=${c.id}`}
            className="dash-card"
            style={{ textAlign: "left", padding: 16, display: "block" }}
          >
            <div style={{ color: "var(--accent)", marginBottom: 8 }}>
              <Icon name={c.icon} size={28} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{c.sub}</div>
          </Link>
        ))}
      </div>

      <SectionHeader title="Opening soon" allHref="/dashboard/browse" allLabel="All →" />
      <div className="dash-card">
        {openingSoon.map((a) => (
          <Link key={a.id} href={`/dashboard/auction/${a.id}`} className="dash-row">
            <div className="dash-row-thumb">
              <Icon name={a.cat === "cars" ? "car" : "phone"} size={22} />
            </div>
            <div>
              <div className="dash-row-title">{a.title}</div>
              <div className="dash-row-meta">
                Opens in <Countdown endsIn={a.endsIn} compact />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="dash-tile-bid-lbl">Starts at</div>
              <div className="dash-row-amt" style={{ color: "var(--accent-light)" }}>
                {fmtNaira(a.start)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
