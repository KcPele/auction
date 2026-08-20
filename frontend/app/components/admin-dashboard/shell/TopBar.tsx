"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuctions, useSystemHealth } from "@/app/components/admin/hooks/use-admin-dashboard";
import { useAdminDisputes } from "@/app/components/admin/hooks/use-admin-extras";
import { SearchBox } from "@/app/components/search/SearchBox";
import { ThemeToggle } from "@/app/components/theme/ThemeToggle";
import { AdminIcon } from "../primitives/Icon";
import { SECTION_LABELS } from "../data";

interface Props {
  onBurgerClick: () => void;
  menuOpen: boolean;
}

function deriveSectionId(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean); // ['admin', maybe section]
  if (parts.length < 2) return "dashboard";
  return parts[1];
}

export function TopBar({ onBurgerClick, menuOpen }: Props) {
  const pathname = usePathname();
  const sectionId = deriveSectionId(pathname);
  const crumb = SECTION_LABELS[sectionId] ?? "Dashboard";

  // This control routes to disputes, so its badge represents disputes only.
  // Other pending queues expose their own counts on the dashboard and pages.
  const disputes = useAdminDisputes({ status: "OPEN" });
  const liveAuctions = useAdminAuctions({ status: "LIVE", limit: 1 });
  const health = useSystemHealth();
  const hasHealthIssue = health.data?.some((service) => service.status !== "ok");
  const alertCount = disputes.data?.total ?? 0;

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur-md md:gap-4 md:px-5">
      <button
        type="button"
        onClick={onBurgerClick}
        aria-controls="admin-navigation"
        aria-expanded={menuOpen}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-fg-muted hover:text-fg lg:hidden"
        aria-label="Open menu"
      >
        <AdminIcon name="menu" size={18} />
      </button>

      <div className="flex items-center gap-2 text-[13px] text-fg-muted">
        <span className="hidden sm:inline">Admin</span>
        <span className="hidden text-fg-dim sm:inline">/</span>
        <span className="font-semibold text-fg">{crumb}</span>
      </div>

      <div className="ml-5 hidden flex-1 md:flex">
        <SearchBox
          getResultHref={(auctionId) =>
            `/admin/auctions?auctionId=${encodeURIComponent(auctionId)}`
          }
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden lg:block"><ThemeToggle /></div>
        <div className="hidden items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-fg-muted md:inline-flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${hasHealthIssue ? "bg-warning" : "bg-success animate-pulse-green"}`}
          />
          <span>
            {health.isLoading
              ? "Checking systems"
              : hasHealthIssue
                ? "System warning"
                : "All systems"}
            {` · ${liveAuctions.data?.total ?? 0} live`}
          </span>
        </div>
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-transparent px-2 py-1.5 text-xs text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg sm:px-2.5"
        >
          <AdminIcon name="bell" size={13} strokeWidth={2} />
          <span className="hidden sm:inline">Alerts</span>
          {alertCount > 0 && (
            <span className="font-bold text-red">{alertCount}</span>
          )}
        </Link>
        <Link
          href="/admin/access-codes"
          className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover sm:px-2.5"
        >
          <AdminIcon name="plus" size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Issue access code</span>
          <span className="sm:hidden">Code</span>
        </Link>
      </div>
    </header>
  );
}
