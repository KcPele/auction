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
    <div className={`mb-10 flex flex-col gap-5 md:mb-12 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={center ? "max-w-3xl" : "max-w-3xl"}>
        {kicker && <div className="mb-3 text-sm font-semibold text-primary">{kicker}</div>}
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {title}
        </h2>
        {sub && <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
