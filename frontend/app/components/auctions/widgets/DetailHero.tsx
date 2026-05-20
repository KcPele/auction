"use client";
import { useState } from "react";
import { Icon } from "@/app/components/user-dashboard/primitives/Icon";
import type { AuctionDetail } from "../types/auction.types";

const HERO_BG = {
  background:
    "repeating-linear-gradient(135deg, rgba(255,170,90,0.03) 0 10px, rgba(255,170,90,0.07) 10px 20px), linear-gradient(180deg, #3a2d1f, #231810)",
};

interface Props {
  auction: AuctionDetail;
}

export function DetailHero({ auction }: Props) {
  const photos = auction.listing?.photoUrls ?? [];
  const [photo, setPhoto] = useState(0);
  const fallbackIcon = auction.category === "cars" ? "car" : "phone";

  return (
    <div
      className="relative -mx-[18px] flex aspect-[4/3] items-center justify-center text-[rgba(255,200,140,0.3)]"
      style={HERO_BG}
    >
      {photos[photo] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[photo]}
          alt={auction.title}
          className="h-full w-full object-cover"
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

      {photos.length > 1 && (
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-1.5">
          {photos.slice(0, 5).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPhoto(i)}
              className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-black/50 backdrop-blur ${
                i === photo
                  ? "border-accent text-accent"
                  : "border-line text-fg-muted"
              }`}
            >
              <Icon name="image" size={14} />
            </button>
          ))}
          <div className="ml-auto rounded-full border border-line bg-black/70 px-2.5 py-1.5 font-mono text-[11px]">
            {photo + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
