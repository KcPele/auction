"use client";
import { useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { pad2 } from "../utils";

interface CountdownProps {
  /** Milliseconds remaining at "now". The widget computes an absolute target on mount. */
  endsIn: number;
  compact?: boolean;
}

export function Countdown({ endsIn, compact = false }: CountdownProps) {
  const [target] = useState(() => Date.now() + endsIn);
  return <CountdownActive target={target} compact={compact} />;
}

function CountdownActive({ target, compact }: { target: number; compact: boolean }) {
  const c = useCountdown(target);
  if (c.done) return <span className="text-fg-dim">Ended</span>;
  if (compact) {
    if (c.d > 0) return <span>{c.d}d {pad2(c.h)}h</span>;
    return <span>{pad2(c.h)}:{pad2(c.m)}:{pad2(c.s)}</span>;
  }
  return (
    <span className="flex items-baseline gap-1 font-mono tabular-nums">
      {c.d > 0 && (
        <>
          <span className="text-[22px] font-bold">{c.d}</span>
          <span className="mr-1 text-[10px] text-fg-dim">d</span>
        </>
      )}
      <span className="text-[22px] font-bold">{pad2(c.h)}</span>
      <span className="mr-1 text-[10px] text-fg-dim">h</span>
      <span className="text-[22px] font-bold">{pad2(c.m)}</span>
      <span className="mr-1 text-[10px] text-fg-dim">m</span>
      <span className="text-[22px] font-bold text-accent-light">{pad2(c.s)}</span>
      <span className="mr-1 text-[10px] text-fg-dim">s</span>
    </span>
  );
}
