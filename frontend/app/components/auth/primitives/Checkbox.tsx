"use client";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}

export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  return (
    <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-muted-foreground">
      <input
        checked={checked}
        className="sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={`mt-px flex size-5 shrink-0 items-center justify-center rounded border ${
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border-strong bg-surface"
        }`}
      >
        {checked && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  );
}
