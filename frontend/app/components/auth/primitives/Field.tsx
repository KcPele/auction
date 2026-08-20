import {
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, meta, className = "", children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const control = isValidElement<{ id?: string }>(children)
    ? cloneElement(children, { id: children.props.id ?? controlId })
    : children;

  return (
    <div className={`mb-[18px] ${className}`}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-xs font-medium text-fg-muted">
        <label htmlFor={controlId}>{label}</label>
        {hint && <span className="font-mono text-[11px] text-fg-dim">{hint}</span>}
      </div>
      {control}
      {meta && <div className="mt-1.5 text-[11px] text-fg-dim">{meta}</div>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

const inputBase =
  "w-full rounded-lg border border-border-strong bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-primary focus:bg-surface-subtle";

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
    <div className="flex overflow-hidden rounded-lg border border-border-strong bg-surface focus-within:border-primary">
      <div className="flex shrink-0 items-center gap-2 border-r border-border bg-surface-subtle px-3.5 py-3 font-mono text-sm text-muted-foreground">
        {prefix}
      </div>
      <input
        className={`w-full bg-transparent px-3.5 py-3 text-base text-foreground outline-none placeholder:text-subtle-foreground ${className}`}
        {...rest}
      />
    </div>
  );
}
