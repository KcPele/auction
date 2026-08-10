import { Clock3, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Auction } from "./types";
import { fmtNaira, formatAuctionTime } from "./utils";

interface AuctionCardProps {
  auction: Auction;
  endSec: number;
}

export function AuctionCard({ auction, endSec }: AuctionCardProps) {
  const image = auction.kind === "car" ? "/images/landing/car-showroom.jpg" : "/images/landing/tech-collection.jpg";
  const isLive = auction.status === "live";

  return (
    <Link
      href={`/dashboard/auction/${auction.id}`}
      className="block overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
      aria-label={`View ${auction.title} auction`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
        {auction.image ? (
          // User uploads may come from any configured storage host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auction.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        )}
        <span className={`absolute left-4 top-4 rounded-md px-2.5 py-1 text-xs font-semibold ${isLive ? "bg-danger text-status-foreground" : "bg-surface text-foreground"}`}>
          {isLive ? "Live" : "Upcoming"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {auction.meta || "Verified listing"}
        </div>
        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">{auction.title}</h3>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <div className="text-xs text-subtle-foreground">{auction.bidders > 0 ? "Current bid" : "Base price"}</div>
            <div className="mt-1 text-lg font-bold text-foreground">{fmtNaira(auction.bid)}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden="true" />{formatAuctionTime(endSec)}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" />{auction.bidders} bidders</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
