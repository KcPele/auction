"use client";
import { useRef, type ChangeEvent, type KeyboardEvent } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const updateCell = (i: number, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    const v = raw.slice(-1);
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="my-2 mb-6 flex w-full max-w-[360px] gap-2">
      {Array.from({ length }).map((_, i) => {
        const v = value[i] ?? "";
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateCell(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className={`h-14 w-0 min-w-0 flex-1 rounded-xl border-[1.5px] bg-surface text-center font-mono text-2xl font-semibold outline-none transition-colors focus:border-accent focus:bg-surface-2 ${
              v ? "border-accent-deep text-accent-2" : "border-line-strong text-fg"
            }`}
          />
        );
      })}
    </div>
  );
}
