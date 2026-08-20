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
import { ArrowRight, BellRing } from "lucide-react";

const adapt = (a: ApiAuction): LandingAuction => ({
  id: a.id,
  title: a.title || "Auction",
  meta: a.subtitle ?? "",
  bid: a.currentBid,
  bidders: a.bidderCount,
  status: a.isLive ? "live" : a.isUpcoming ? "scheduled" : "scheduled",
  end: Math.max(0, Math.floor((a.endTime.getTime() - Date.now()) / 1000)),
  kind: a.category === "cars" ? "car" : "gadget",
  tag: a.category === "cars" ? "CAR" : "GADGET",
  image: a.photoUrl,
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
    ...(live.data?.items ?? []).map(adapt),
    ...(upcoming.data?.items ?? []).map(adapt),
  ].slice(0, 6);
  const liveCount = live.data?.total ?? 0;

  return (
    <Section id="auctions">
      <SectionHead
        kicker={
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            {liveCount} auction{liveCount === 1 ? "" : "s"} live now
          </span>
        }
        title={
          <>
            Live and upcoming auctions
          </>
        }
        right={
          <div className="flex gap-2.5">
            <Button href="/register" variant="ghost">
              Browse all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {live.isLoading && upcoming.isLoading ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center text-sm text-muted-foreground">
          Loading auctions…
        </div>
      ) : live.isError && upcoming.isError ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-14 text-center">
          <h3 className="text-lg font-bold text-foreground">Auctions are temporarily unavailable</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            We could not load the marketplace. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => {
              void live.refetch();
              void upcoming.refetch();
            }}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      ) : auctions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-lg font-bold text-foreground">New auctions are being prepared</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The marketplace is fresh. Create an account and we will let you know when the first verified listings go live.
          </p>
          <Button href="/register" className="mt-6">Create account</Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((a) => {
            const endSec = Math.max(0, a.end - tick);
            return <AuctionCard key={a.id} auction={a} endSec={endSec} />;
          })}
        </div>
      )}
    </Section>
  );
}
