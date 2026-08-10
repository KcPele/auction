"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CarFront, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCategoryStats } from "./api/public.api";
import { Section } from "./Section";
import { SectionHead } from "./primitives/SectionHead";

const CATEGORIES = [
  {
    key: "cars" as const,
    title: "Cars",
    description: "Mechanic-reviewed vehicles with clear condition notes and ownership documentation.",
    image: "/images/landing/car-showroom.jpg",
    alt: "Blue car outside a modern showroom",
    icon: CarFront,
  },
  {
    key: "gadgets" as const,
    title: "Gadgets",
    description: "Phones, laptops, cameras, and more with proof of ownership and disclosed condition.",
    image: "/images/landing/tech-collection.jpg",
    alt: "Laptop, camera, and personal technology arranged on a desk",
    icon: Smartphone,
  },
];

export function Categories() {
  const { data } = useQuery({
    queryKey: ["public", "category-stats"],
    queryFn: getCategoryStats,
    staleTime: 60_000,
  });
  const byKey = new Map(data?.map((stat) => [stat.key, stat]) ?? []);

  return (
    <Section className="bg-background">
      <SectionHead
        kicker="Explore the marketplace"
        title="Find the right auction without the noise."
        sub="Start with a category, review verified listing details, and follow only the auctions that matter to you."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map(({ key, title, description, image, alt, icon: Icon }) => {
          const stat = byKey.get(key);
          return (
            <article key={key} className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]">
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-subtle">
                <Image src={image} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 hover:scale-[1.02]" />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between gap-5">
                  <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat?.liveCount ?? 0} live now
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 max-w-lg leading-7 text-muted-foreground">{description}</p>
                <Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover">
                  View {title.toLowerCase()} auctions
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
