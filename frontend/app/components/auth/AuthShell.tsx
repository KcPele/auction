import type { ReactNode } from "react";
import { AuthBrandPanel, type BrandVariant } from "./AuthBrandPanel";

interface AuthShellProps {
  variant?: BrandVariant;
  children: ReactNode;
}

export function AuthShell({ variant = "bid", children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <AuthBrandPanel variant={variant} />
      <div className="flex min-h-screen flex-col bg-bg px-6 pb-12 pt-8 md:px-14 md:py-12 xl:px-18">
        {children}
      </div>
    </div>
  );
}
