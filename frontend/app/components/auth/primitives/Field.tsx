import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}

export function Field({ label, hint, meta, children }: FieldProps) {
  return (
    <div className="mb-[18px]">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-xs font-medium text-fg-muted">
        <span>{label}</span>
        {hint && <span className="font-mono text-[11px] text-fg-dim">{hint}</span>}
      </div>
      {children}
      {meta && <div className="mt-1.5 text-[11px] text-fg-dim">{meta}</div>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

const inputBase =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-accent focus:bg-surface-2";

export function Input({ leftIcon, rightSlot, className = "", ...rest }: InputProps) {
  if (!leftIcon && !rightSlot) {
    return <input className={`${inputBase} ${className}`} {...rest} />;
  }
  return (
    <div className="relative">
      {leftIcon && (
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-dim">
          {leftIcon}
        </div>
      )}
      <input
        className={`${inputBase} ${leftIcon ? "pl-11" : ""} ${rightSlot ? "pr-11" : ""} ${className}`}
        {...rest}
      />
      {rightSlot && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

interface PhoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
}

export function PhoneInput({ prefix = "🇳🇬 +234", className = "", ...rest }: PhoneInputProps) {
  return (
    <div className="flex overflow-hidden rounded-[10px] border border-line-strong bg-surface focus-within:border-accent">
      <div className="flex shrink-0 items-center gap-2 border-r border-line bg-surface-2 px-3.5 py-3 font-mono text-sm text-fg-muted">
        {prefix}
      </div>
      <input
        className={`w-full bg-transparent px-3.5 py-3 text-[15px] text-fg outline-none placeholder:text-fg-dim ${className}`}
        {...rest}
      />
    </div>
  );
}
