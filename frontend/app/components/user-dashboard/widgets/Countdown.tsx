"use client";
import { useEffect, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { pad2 } from "../utils";

type CountdownProps = {
  /** Absolute target timestamp in milliseconds. */
  target?: number;
  /** Milliseconds remaining at "now". */
  endsIn?: number;
  compact?: boolean;
};

export function Countdown({ target, endsIn, compact = false }: CountdownProps) {
  if (target !== undefined) {
    return <CountdownActive target={target} compact={compact} />;
  }
  return <CountdownFromDuration endsIn={endsIn ?? 0} compact={compact} />;
}

function CountdownFromDuration({
  endsIn,
  compact,
}: {
  endsIn: number;
  compact: boolean;
}) {
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTarget(Date.now() + endsIn);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [endsIn]);

  if (target === null) {
    return <CountdownDisplay delta={endsIn} compact={compact} />;
  }
  return <CountdownActive target={target} compact={compact} />;
}

function CountdownActive({ target, compact }: { target: number; compact: boolean }) {
  const c = useCountdown(target);
  if (c.delta === null) return <CountdownDisplay delta={0} compact={compact} pending />;
  if (c.done) return <span className="text-fg-dim">Ended</span>;
  return <CountdownDisplay delta={c.delta} compact={compact} />;
}

function CountdownDisplay({
  delta,
  compact,
  pending = false,
}: {
  delta: number;
  compact: boolean;
  pending?: boolean;
}) {
  const d = Math.floor(delta / 86_400_000);
  const h = Math.floor((delta / 3_600_000) % 24);
  const m = Math.floor((delta / 60_000) % 60);
  const s = Math.floor((delta / 1000) % 60);
  if (compact) {
    if (pending) return <span>--:--:--</span>;
    if (d > 0) return <span>{d}d {pad2(h)}h</span>;
    return <span>{pad2(h)}:{pad2(m)}:{pad2(s)}</span>;
  }
  return (
    <span className="flex items-baseline gap-1 font-mono tabular-nums">
      {d > 0 && (
        <>
          <span className="text-[22px] font-bold">{d}</span>
          <span className="mr-1 text-[10px] text-fg-dim">d</span>
        </>
      )}
      <span className="text-[22px] font-bold">{pending ? "--" : pad2(h)}</span>
      <span className="mr-1 text-[10px] text-fg-dim">h</span>
      <span className="text-[22px] font-bold">{pending ? "--" : pad2(m)}</span>
      <span className="mr-1 text-[10px] text-fg-dim">m</span>
      <span className="text-[22px] font-bold text-accent-light">
        {pending ? "--" : pad2(s)}
      </span>
      <span className="mr-1 text-[10px] text-fg-dim">s</span>
    </span>
  );
}
