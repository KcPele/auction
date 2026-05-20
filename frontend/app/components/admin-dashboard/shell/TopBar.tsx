"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuctions } from "@/app/components/admin/hooks/use-admin-dashboard";
import { useAdminDisputes } from "@/app/components/admin/hooks/use-admin-extras";
import { usePendingWithdrawals } from "@/app/components/admin/hooks/use-admin-withdrawals";
import { usePendingApplications, usePendingListings } from "@/app/components/admin/hooks/use-admin-listings";
import { AdminIcon } from "../primitives/Icon";
import { SECTION_LABELS } from "../data";

interface Props {
  onBurgerClick: () => void;
}

function deriveSectionId(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean); // ['admin', maybe section]
  if (parts.length < 2) return "dashboard";
  return parts[1];
}

export function TopBar({ onBurgerClick }: Props) {
  const pathname = usePathname();
  const sectionId = deriveSectionId(pathname);
  const crumb = SECTION_LABELS[sectionId] ?? "Dashboard";

  // Aggregate "needs attention" badge: open disputes + pending withdrawals +
  // pending applications + pending listings.
  const disputes = useAdminDisputes({ status: "OPEN" });
  const withdrawals = usePendingWithdrawals();
  const applications = usePendingApplications();
  const listings = usePendingListings();
  const liveAuctions = useAdminAuctions({ status: "LIVE", limit: 1 });
  const alertCount =
    (disputes.data?.total ?? 0) +
    (withdrawals.data?.length ?? 0) +
    (applications.data?.length ?? 0) +
    (listings.data?.length ?? 0);

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-line px-3 backdrop-blur-md md:gap-4 md:px-5"
      style={{ background: "rgba(15, 11, 7, 0.7)" }}
    >
      <button
        type="button"
        onClick={onBurgerClick}
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

      <div className="ml-5 hidden max-w-[440px] flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-[7px] text-fg-muted md:flex">
        <AdminIcon name="search" size={13} strokeWidth={2} />
        <input
          placeholder="Search users, listings, auctions, ledger entries..."
          className="flex-1 border-none bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-dim"
        />
        <span className="rounded border border-line px-[5px] py-px font-mono text-[10px] text-fg-dim">⌘K</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-fg-muted md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse-green" />
          <span>All systems · {liveAuctions.data?.total ?? 0} live</span>
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
          className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-xs font-semibold text-[#1a0a00] hover:shadow-lg hover:shadow-accent/30 sm:px-2.5"
          style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
        >
          <AdminIcon name="plus" size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Issue access code</span>
          <span className="sm:hidden">Code</span>
        </Link>
      </div>
    </header>
  );
}
