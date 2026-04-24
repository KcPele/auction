import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center gap-2 rounded-full font-semibold whitespace-nowrap border transition-transform duration-150 hover:-translate-y-px active:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "border-transparent text-[#1a0a00] bg-[linear-gradient(180deg,var(--accent-light),var(--accent))] shadow-[0_6px_24px_rgba(232,183,85,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_10px_32px_rgba(232,183,85,0.5),inset_0_1px_0_rgba(255,255,255,0.45)]",
  ghost:
    "bg-transparent text-fg border-line-strong hover:bg-[rgba(255,170,90,0.06)] hover:border-accent",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-[15px]",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
