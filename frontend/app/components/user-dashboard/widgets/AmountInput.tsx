"use client";

interface AmountInputProps {
  value: number;
  onChange: (naira: number) => void;
  max?: number;
  label?: string;
}

/**
 * Big editable naira amount. Digits only — the grouping separators are added
 * for display and stripped on the way back in, so the caret never fights the
 * formatter.
 */
export function AmountInput({
  value,
  onChange,
  max = 100_000_000,
  label = "Amount",
}: AmountInputProps) {
  const onInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    const next = digits ? Number(digits) : 0;
    onChange(next > max ? max : next);
  };

  return (
    <label className="block">
      <span className="mt-2 block text-xs uppercase tracking-[0.1em] text-fg-dim">
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-[26px] font-semibold text-fg-dim">
          ₦
        </span>
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${label} in naira`}
          value={value ? value.toLocaleString("en-NG") : ""}
          placeholder="0"
          onChange={(event) => onInput(event.target.value)}
          className="w-full min-w-0 border-none bg-transparent p-0 font-display text-[46px] font-semibold tracking-tight tabular-nums text-fg outline-none placeholder:text-fg-dim"
        />
      </span>
    </label>
  );
}
