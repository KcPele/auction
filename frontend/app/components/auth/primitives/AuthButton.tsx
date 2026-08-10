import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover",
  ghost:
    "py-3 font-medium text-fg border border-line-strong bg-surface hover:bg-surface-2",
};

export function AuthButton({ variant = "primary", className = "", children, ...rest }: AuthButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
