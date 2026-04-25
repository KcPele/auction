import type { ReactNode } from "react";

export function SectionHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-[32px]">
          {title}
        </h1>
        {sub && <div className="mt-1 max-w-2xl text-[13px] text-fg-muted">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
