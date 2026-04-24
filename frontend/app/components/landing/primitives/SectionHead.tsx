import type { ReactNode } from "react";

interface SectionHeadProps {
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  center?: boolean;
}

export function SectionHead({ kicker, title, sub, right, center = false }: SectionHeadProps) {
  return (
    <div
      className={`flex flex-wrap gap-10 mb-12 ${
        center ? "flex-col items-center text-center" : "items-end justify-between"
      }`}
    >
      <div>
        {kicker && (
          <div className="text-xs font-bold tracking-[0.14em] uppercase text-accent mb-3.5">{kicker}</div>
        )}
        <h2 className="font-display font-semibold leading-[1.02] tracking-[-0.025em] m-0 max-w-[760px] text-fg text-[clamp(36px,4vw,56px)]">
          {title}
        </h2>
      </div>
      {right}
      {sub && <p className="text-[17px] text-fg-muted max-w-[440px] leading-[1.55]">{sub}</p>}
    </div>
  );
}
