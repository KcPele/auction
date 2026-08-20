"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, ShieldCheck, WalletCards } from "lucide-react";
import Image from "next/image";
import { getPublicStats } from "./api/public.api";
import { fmtCompactNaira } from "./utils";
import { Button } from "./primitives/Button";

const TRUST_POINTS = [
  { icon: BadgeCheck, label: "Admin-reviewed listings" },
  { icon: ShieldCheck, label: "Verified ownership" },
  { icon: WalletCards, label: "Transparent wallet holds" },
];

export function Hero() {
  const { data: stats, isError } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: getPublicStats,
    staleTime: 60_000,
  });

  const number = new Intl.NumberFormat("en-NG");
  const summary = [
    { value: stats ? fmtCompactNaira(stats.tradedVolume) : isError ? "—" : "₦0", label: "Auction volume" },
    { value: stats ? number.format(stats.verifiedBidders) : isError ? "—" : "0", label: "Verified bidders" },
    { value: stats ? `${stats.settlementRate}%` : "—", label: "Settlement rate" },
  ];

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            Verified auctions across Nigeria
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Buy and sell with confidence.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            A transparent marketplace for verified cars and gadgets. Review the details, bid with real funds, and settle securely through one accountable platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#auctions" size="lg">
              Browse auctions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button href="/register" variant="ghost" size="lg">
              Sell an item
            </Button>
          </div>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-subtle shadow-[var(--shadow-md)]">
            <Image
              src="/images/landing/car-showroom.jpg?variant=hero"
              alt="A verified car presented outside a modern showroom"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
            />
          </div>
          <div className="relative -mt-8 mx-4 grid grid-cols-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-md)] sm:mx-8 sm:p-5">
            {summary.map((item, index) => (
              <div key={item.label} className={index > 0 ? "border-l border-border pl-4 sm:pl-6" : ""}>
                <div className="text-base font-bold tracking-tight text-foreground sm:text-xl">{item.value}</div>
                <div className="mt-1 text-[0.6875rem] leading-4 text-subtle-foreground sm:text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
