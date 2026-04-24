"use client";
import { useCountdown } from "./hooks/useCountdown";
import { pad2 } from "./utils";

type CountdownSize = "sm" | "md" | "lg" | "xl";

interface CountdownProps {
  target: number;
  size?: CountdownSize;
  label?: string;
}

const NUM_SIZE: Record<CountdownSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-[22px]",
  xl: "text-5xl",
};

export function Countdown({ target, size = "lg", label = "ENDS IN" }: CountdownProps) {
  const { h, m, s } = useCountdown(target);
  const numCls = `font-bold text-fg ${NUM_SIZE[size]}`;
  return (
    <div className="inline-flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red">{label}</span>
      )}
      <div className="flex items-baseline gap-1 font-mono tabular-nums">
        <span className="inline-flex items-baseline gap-px">
          <span className={numCls}>{pad2(h)}</span>
          <span className="text-[11px] text-fg-dim mr-0.5">h</span>
        </span>
        <span className="text-fg-dim">:</span>
        <span className="inline-flex items-baseline gap-px">
          <span className={numCls}>{pad2(m)}</span>
          <span className="text-[11px] text-fg-dim mr-0.5">m</span>
        </span>
        <span className="text-fg-dim">:</span>
        <span className="inline-flex items-baseline gap-px">
          <span className={`${numCls} !text-accent-2`}>{pad2(s)}</span>
          <span className="text-[11px] text-fg-dim mr-0.5">s</span>
        </span>
      </div>
    </div>
  );
}
