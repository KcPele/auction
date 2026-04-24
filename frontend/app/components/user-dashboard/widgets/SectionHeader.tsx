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
    <div className="dash-section-header">
      <div>
        <div className="dash-section-h">{title}</div>
        {sub && <div className="dash-section-sub">{sub}</div>}
      </div>
      {allHref && (
        <Link href={allHref} className="dash-section-all">
          {allLabel ?? "See all →"}
        </Link>
      )}
    </div>
  );
}
