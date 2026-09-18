"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./Icon";

type ListingImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
  eager?: boolean;
};

export function ListingImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  fetchPriority = "auto",
  eager = false,
}: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-media-background text-media-foreground">
        <Icon name="image" size={24} />
      </span>
    );
  }

  return (
    <Image
      fill
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      fetchPriority={fetchPriority}
      priority={eager}
      onError={() => setFailed(true)}
    />
  );
}
