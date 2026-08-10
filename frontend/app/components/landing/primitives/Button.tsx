import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "secondary";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  href?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md border font-semibold whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "border-contrast bg-contrast text-contrast-foreground shadow-sm hover:opacity-90",
  ghost:
    "border-border-strong bg-surface text-foreground hover:border-primary hover:bg-primary-soft hover:text-primary",
};

const sizes: Record<Size, string> = {
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm md:px-6 md:text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
