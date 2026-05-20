const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STEPS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 3600_000 },
  { unit: "month", ms: 30 * 24 * 3600_000 },
  { unit: "week", ms: 7 * 24 * 3600_000 },
  { unit: "day", ms: 24 * 3600_000 },
  { unit: "hour", ms: 3600_000 },
  { unit: "minute", ms: 60_000 },
];

export function timeAgo(date: Date): string {
  const diff = date.getTime() - Date.now();
  for (const { unit, ms } of STEPS) {
    if (Math.abs(diff) >= ms) return RTF.format(Math.round(diff / ms), unit);
  }
  return "just now";
}
