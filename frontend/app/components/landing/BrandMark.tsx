interface BrandMarkProps {
  size?: number;
  showWord?: boolean;
}

export function BrandMark({ size = 28, showWord = true }: BrandMarkProps) {
  return (
    <div className="inline-flex items-center" style={{ gap: size * 0.35 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#bm-grad)" />
        <path
          d="M9 22.5 L18.5 13 M15 9.5 L21.5 16 M12.5 7 L24 18.5"
          stroke="#0A0A0B"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="22.5" r="2" fill="#0A0A0B" />
      </svg>
      {showWord && (
        <span
          className="font-display font-bold tracking-[-0.02em] text-fg"
          style={{ fontSize: size * 0.7 }}
        >
          Bid
          <span className="italic accent-gradient-text">Naija</span>
        </span>
      )}
    </div>
  );
}
