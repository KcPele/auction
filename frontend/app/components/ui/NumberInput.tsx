"use client";
import { useId } from "react";

interface NumberInputProps {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
}

const HIDE_NATIVE_SPIN =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0";

export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  className = "",
  ariaLabel,
}: NumberInputProps) {
  const id = useId();
  const clamp = (n: number) => {
    if (typeof min === "number" && n < min) return min;
    if (typeof max === "number" && n > max) return max;
    return n;
  };
  const dec = () => onChange(clamp(round(value - step, step)));
  const inc = () => onChange(clamp(round(value + step, step)));

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-line bg-surface focus-within:border-accent/40">
        <button
          type="button"
          onClick={dec}
          aria-label="Decrease"
          className="flex w-7 cursor-pointer items-center justify-center border-r border-line text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          aria-label={ariaLabel}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? clamp(v) : 0);
          }}
          className={`w-16 bg-transparent px-2 py-1.5 text-center text-sm outline-none ${HIDE_NATIVE_SPIN}`}
        />
        <button
          type="button"
          onClick={inc}
          aria-label="Increase"
          className="flex w-7 cursor-pointer items-center justify-center border-l border-line text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          +
        </button>
      </div>
      {suffix && <span className="text-xs text-fg-muted">{suffix}</span>}
    </div>
  );
}

function round(n: number, step: number) {
  if (step >= 1) return Math.round(n);
  const decimals = (step.toString().split(".")[1] ?? "").length;
  return Number(n.toFixed(decimals));
}
