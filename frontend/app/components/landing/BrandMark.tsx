import { Gavel } from "lucide-react";

interface BrandMarkProps {
  size?: number;
  showWord?: boolean;
  tone?: "default" | "inverse";
}

export function BrandMark({ showWord = true, tone = "default" }: BrandMarkProps) {
  return (
    <div className="inline-flex items-center gap-2.5" aria-label="BidNaija">
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Gavel className="size-5" aria-hidden="true" />
      </span>
      {showWord && (
        <span
          className={`text-lg font-bold tracking-tight ${
            tone === "inverse" ? "text-contrast-foreground" : "text-foreground"
          }`}
        >
          BidNaija
        </span>
      )}
    </div>
  );
}
