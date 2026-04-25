interface Props {
  points: number[];
  color?: string;
  className?: string;
}

export function Sparkline({ points, color = "var(--accent)", className }: Props) {
  const w = 70;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(" ");
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}
