import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`relative px-5 py-24 md:px-10 md:py-[100px] ${className}`}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

export function SectionDivider() {
  return (
    <div className="mx-auto h-px max-w-[1280px] bg-[linear-gradient(90deg,transparent,var(--line-strong)_20%,var(--line-strong)_80%,transparent)]" />
  );
}
