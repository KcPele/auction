import { Sparkline } from "./Sparkline";

interface Props {
  label: string;
  value: string;
  delta: string;
  deltaDir: "up" | "down" | "flat";
  spark: number[];
  sparkColor?: string;
  onClick?: () => void;
}

const DELTA_COLOR: Record<Props["deltaDir"], string> = {
  up: "text-green",
  down: "text-red",
  flat: "text-fg-dim",
};

const DELTA_SYMBOL: Record<Props["deltaDir"], string> = {
  up: "▲",
  down: "▼",
  flat: "–",
};

export function KPICard({ label, value, delta, deltaDir, spark, sparkColor, onClick }: Props) {
  const content = (
    <>
      <div className="text-[11px] uppercase tracking-[0.1em] text-fg-dim">{label}</div>
      <div className="mt-2 mb-1 font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {value}
      </div>
      <div className={`font-mono text-xs ${DELTA_COLOR[deltaDir]}`}>
        {DELTA_SYMBOL[deltaDir]} {delta}
      </div>
      <div className="absolute right-3 bottom-3 hidden opacity-60 sm:block">
        <Sparkline points={spark} color={sparkColor} />
      </div>
    </>
  );

  const className =
    "relative overflow-hidden rounded-[10px] border border-line bg-surface p-3.5 text-left transition-colors sm:p-4";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${className} hover:border-line-strong`}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
