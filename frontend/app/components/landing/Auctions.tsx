"use client";
import { AuctionCard } from "./AuctionCard";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";
import { Button } from "./primitives/Button";
import { LiveDot } from "./primitives/LiveDot";
import { AUCTIONS } from "./data";
import { useTick } from "./hooks/useTick";

export function Auctions() {
  const tick = useTick(1000);
  const liveCount = AUCTIONS.filter((a) => a.status === "live").length;

  return (
    <Section id="auctions">
      <SectionHead
        kicker={
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            {liveCount} auctions live right now
          </span>
        }
        title={
          <>
            On the <em className="italic accent-gradient-text">block</em> this hour.
          </>
        }
        right={
          <div className="flex gap-2.5">
            <Button href="/login" variant="ghost">All auctions</Button>
            <Button href="/register" variant="primary">Open feed</Button>
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {AUCTIONS.map((a, i) => {
          const endSec = Math.max(0, a.end - tick);
          return <AuctionCard key={i} auction={a} endSec={endSec} />;
        })}
      </div>
    </Section>
  );
}
