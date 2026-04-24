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
      className={`my-10 flex w-full max-w-[420px] flex-1 flex-col justify-center max-sm:my-7 ${
        centered ? "items-center text-center" : ""
      }`}
    >
      {stepper}
      {eyebrow && (
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
          {eyebrow}
        </div>
      )}
      {title && (
        <h1 className="m-0 mb-2 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="m-0 mb-8 max-w-[380px] text-sm text-fg-muted">{subtitle}</p>
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
    <div className="flex items-center justify-between">
      <div className="text-[13px] text-fg-dim">{left}</div>
      {right && <div className="text-[13px] text-fg-muted">{right}</div>}
    </div>
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3.5 text-[11px] uppercase tracking-[0.1em] text-fg-dim before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
      {children}
    </div>
  );
}
