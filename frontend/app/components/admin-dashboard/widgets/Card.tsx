import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-line bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

interface HeadProps {
  title: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  controls?: ReactNode;
}

export function CardHead({ title, badge, action, controls }: HeadProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line px-3.5 py-3 sm:px-[18px]">
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        {title}
        {badge}
      </div>
      <div className="flex items-center gap-2">
        {controls}
        {action}
      </div>
    </div>
  );
}

export function CardBody({
  children,
  flush = false,
  className = "",
}: {
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <div className={`${flush ? "" : "px-3.5 pt-3 pb-4 sm:px-[18px]"} ${className}`}>
      {children}
    </div>
  );
}
