"use client";
import { useState } from "react";
import { Icon } from "@/app/components/user-dashboard/primitives/Icon";
import { ListingImage } from "@/app/components/user-dashboard/primitives/ListingImage";
import type { AuctionDetail } from "../types/auction.types";

type Slide = { kind: "photo" | "video"; url: string };

interface Props {
  auction: AuctionDetail;
}

export function DetailHero({ auction }: Props) {
  const photos = auction.listing?.photoUrls ?? [];
  const videos = auction.listing?.videoUrls ?? [];
  const slides: Slide[] = [
    ...photos.map((url) => ({ kind: "photo" as const, url })),
    ...videos.map((url) => ({ kind: "video" as const, url })),
  ];
  const [index, setIndex] = useState(0);
  const fallbackIcon = auction.category === "cars" ? "car" : "phone";
  const current = slides[index];

  return (
    <div className="relative -mx-[18px] flex aspect-[4/3] items-center justify-center bg-media-background text-media-foreground">
      {current?.kind === "video" ? (
        <video
          src={current.url}
          controls
          playsInline
          className="h-full w-full bg-media-background object-contain"
        />
      ) : current ? (
        <ListingImage
          src={current.url}
          alt={auction.title}
          sizes="(max-width: 1024px) 100vw, 900px"
          fetchPriority="high"
          eager
        />
      ) : (
        <Icon name={fallbackIcon} size={70} />
      )}

      {auction.isLive && (
        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[5px] border border-red/30 bg-red/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-red">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-red" />{" "}
          Live
        </span>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {slides.map((s, i) => (
              <button
                key={`${s.kind}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-overlay text-status-foreground backdrop-blur ${
                  i === index
                    ? "border-accent text-accent"
                    : "border-line text-fg-muted"
                }`}
              >
                <Icon name={s.kind === "video" ? "play" : "image"} size={14} />
              </button>
            ))}
          </div>
          <div className="rounded-full border border-line bg-overlay px-2.5 py-1.5 font-mono text-[11px] text-status-foreground">
            {index + 1} / {slides.length}
          </div>
        </div>
      )}
    </div>
  );
}
