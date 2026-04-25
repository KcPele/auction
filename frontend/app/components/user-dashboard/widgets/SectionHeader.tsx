import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: ReactNode;
  sub?: ReactNode;
  allHref?: string;
  allLabel?: string;
}

export function SectionHeader({ title, sub, allHref, allLabel }: SectionHeaderProps) {
  return (
    <div className="my-3 mt-5 flex items-center justify-between">
      <div>
        <div className="text-[15px] font-semibold tracking-tight">{title}</div>
        {sub && <div className="text-xs text-fg-dim">{sub}</div>}
      </div>
      {allHref && (
        <Link href={allHref} className="text-xs font-medium text-accent">
          {allLabel ?? "See all →"}
        </Link>
      )}
    </div>
  );
}
