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
    <label
      className="mb-[18px] flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-fg-muted"
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
    >
      <span
        className={`mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] ${
          checked
            ? "border-accent bg-accent text-[#0a0806]"
            : "border-line-strong bg-surface"
        }`}
      >
        {checked && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  );
}
