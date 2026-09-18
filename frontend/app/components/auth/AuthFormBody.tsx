import type { ReactNode } from "react";

interface AuthFormBodyProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  stepper?: ReactNode;
  children: ReactNode;
  centered?: boolean;
}

export function AuthFormBody({
  eyebrow,
  title,
  subtitle,
  stepper,
  children,
  centered,
}: AuthFormBodyProps) {
  return (
    <div
      className={`my-10 flex w-full max-w-md flex-1 flex-col justify-center max-sm:my-7 ${
        centered ? "items-center text-center" : ""
      }`}
    >
      {stepper}
      {eyebrow && (
        <div className="mb-2.5 text-sm font-semibold text-primary">
          {eyebrow}
        </div>
      )}
      {title && (
        <h1 className="m-0 mb-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="m-0 mb-8 max-w-sm text-sm leading-6 text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export function AuthFormTop({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4  md:pr-32">
      <div className="text-sm text-subtle-foreground">{left}</div>
      {right && <div className="text-sm text-muted-foreground">{right}</div>}
    </div>
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3.5 text-[11px] uppercase tracking-widest text-fg-dim before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
      {children}
    </div>
  );
}
