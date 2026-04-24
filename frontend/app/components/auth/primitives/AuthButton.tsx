import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] text-sm transition-transform duration-100 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "py-3.5 text-[15px] font-bold text-[#1a0a00] bg-[linear-gradient(180deg,var(--accent-light),var(--accent))] shadow-[0_6px_24px_rgba(232,183,85,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-px disabled:hover:translate-y-0",
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
