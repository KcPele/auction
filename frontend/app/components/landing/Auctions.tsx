"use client";
import { useQuery } from "@tanstack/react-query";
import { listAuctions } from "@/app/components/auctions/api/auction.api";
import type { Auction as ApiAuction } from "@/app/components/auctions/types/auction.types";
import { AuctionCard } from "./AuctionCard";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { Button } from "./primitives/Button";
import { LiveDot } from "./primitives/LiveDot";
import { useTick } from "./hooks/useTick";
import type { Auction as LandingAuction } from "./types";

const adapt = (a: ApiAuction): LandingAuction => ({
  title: a.title || "Auction",
  meta: a.subtitle ?? "",
  bid: a.basePrice,
  bidders: 0,
  status: a.isLive ? "live" : a.isUpcoming ? "scheduled" : "scheduled",
  end: Math.max(0, Math.floor((a.endTime.getTime() - Date.now()) / 1000)),
  kind: a.category === "cars" ? "car" : "gadget",
  tag: a.category === "cars" ? "CAR" : "GADGET",
});

export function Auctions() {
  const tick = useTick(1000);

  // Public endpoint — no auth required.
  const live = useQuery({
    queryKey: ["landing", "auctions", "live"],
    queryFn: () => listAuctions({ status: "LIVE", limit: 6 }),
    staleTime: 30_000,
  });
  const upcoming = useQuery({
    queryKey: ["landing", "auctions", "scheduled"],
    queryFn: () => listAuctions({ status: "SCHEDULED", limit: 6 }),
    staleTime: 30_000,
  });

  const auctions: LandingAuction[] = [
    ...(live.data ?? []).map(adapt),
    ...(upcoming.data ?? []).map(adapt),
  ].slice(0, 6);
  const liveCount = live.data?.length ?? 0;

  return (
    <Section id="auctions">
      <SectionHead
        kicker={
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            {liveCount} auction{liveCount === 1 ? "" : "s"} live right now
          </span>
        }
        title={
          <>
            On the{" "}
            <em className="italic accent-gradient-text">block</em> this hour.
          </>
        }
        right={
          <div className="flex gap-2.5">
            <Button href="/login" variant="ghost">
              All auctions
            </Button>
            <Button href="/register" variant="primary">
              Open feed
            </Button>
          </div>
        }
      />

      {live.isLoading && upcoming.isLoading ? (
        <div className="py-12 text-center text-sm text-fg-muted">
          Loading auctions…
        </div>
      ) : auctions.length === 0 ? (
        <div className="py-12 text-center text-sm text-fg-muted">
          No auctions yet — check back soon.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((a, i) => {
            const endSec = Math.max(0, a.end - Math.floor(tick / 1000));
            return <AuctionCard key={i} auction={a} endSec={endSec} />;
          })}
        </div>
      )}
    </Section>
  );
}
