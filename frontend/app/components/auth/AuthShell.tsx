import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "../landing/BrandMark";
import { ThemeToggle } from "../theme/ThemeToggle";
import { AuthBrandPanel, type BrandVariant } from "./AuthBrandPanel";

interface AuthShellProps {
  variant?: BrandVariant;
  children: ReactNode;
}

export function AuthShell({ variant = "bid", children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <AuthBrandPanel variant={variant} />
      <main className="relative flex min-h-screen flex-col bg-background px-6 pb-12 pt-8 md:px-14 md:py-12 xl:px-18">
        <Link className="mb-10 w-fit md:hidden" href="/">
          <BrandMark />
        </Link>
        <div className="absolute right-6 top-6 md:right-10 md:top-8">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
