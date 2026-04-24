"use client";
import { useCountdown } from "../hooks/useCountdown";
import { pad2 } from "../utils";

interface CountdownProps {
  target: number;
  compact?: boolean;
}

export function Countdown({ target, compact = false }: CountdownProps) {
  const c = useCountdown(target);
  if (c.done) return <span className="dash-dim">Ended</span>;
  if (compact) {
    if (c.d > 0) return <span>{c.d}d {pad2(c.h)}h</span>;
    return <span>{pad2(c.h)}:{pad2(c.m)}:{pad2(c.s)}</span>;
  }
  return (
    <span className="dash-countdown-big">
      {c.d > 0 && (
        <>
          <span className="n">{c.d}</span>
          <span className="u">d</span>
        </>
      )}
      <span className="n">{pad2(c.h)}</span>
      <span className="u">h</span>
      <span className="n">{pad2(c.m)}</span>
      <span className="u">m</span>
      <span className="n pulse">{pad2(c.s)}</span>
      <span className="u">s</span>
    </span>
  );
}
