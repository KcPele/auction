"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { AdminIcon, type AdminIconName } from "../primitives/Icon";

interface NavItem {
  id: string;
  label: string;
  icon: AdminIconName;
  href: string;
}
interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "grid", href: "/admin" },
      { id: "auctions", label: "Live auctions", icon: "radio", href: "/admin/auctions" },
    ],
  },
  {
    group: "MODERATION",
    items: [
      { id: "access-codes", label: "Access code requests", icon: "key", href: "/admin/access-codes" },
      { id: "listings", label: "Listing approvals", icon: "check", href: "/admin/listings" },
      { id: "disputes", label: "Disputes", icon: "alert", href: "/admin/disputes" },
    ],
  },
  {
    group: "DIRECTORIES",
    items: [
      { id: "users", label: "Users & wallets", icon: "users", href: "/admin/users" },
      { id: "mechanics", label: "Mechanics", icon: "wrench", href: "/admin/mechanics" },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      { id: "payments", label: "Payments & ledger", icon: "receipt", href: "/admin/payments" },
      { id: "withdrawals", label: "Withdrawal auth", icon: "wallet", href: "/admin/withdrawals" },
      { id: "settlements", label: "Settlements", icon: "check", href: "/admin/settlements" },
      { id: "notifications", label: "Notifications log", icon: "bell", href: "/admin/notifications" },
      { id: "health", label: "System health", icon: "radio", href: "/admin/health" },
      { id: "settings", label: "Settings", icon: "sliders", href: "/admin/settings" },
    ],
  },
];

interface Props {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: Props) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const initials = me
    ? `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase()
    : "AD";

  return (
    <aside className="z-[60] flex h-full flex-col overflow-hidden border-r border-line bg-bg-1">
      <div className="flex items-center justify-between border-b border-line px-[18px] py-4">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="adm-sbg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#adm-sbg)" />
            <path
              d="M9 22.5 L18.5 13 M15 9.5 L21.5 16 M12.5 7 L24 18.5"
              stroke="#0a0806"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="22.5" cy="22.5" r="2" fill="#0a0806" />
          </svg>
          <span className="font-display text-[17px] font-bold tracking-tight text-fg">
            Bid<span className="accent-gradient-text italic">Naija</span>
          </span>
        </div>
        <span className="rounded border border-line-strong bg-accent/5 px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] text-accent">
          ADMIN
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-dim">
              {section.group}
            </div>
            {section.items.map((it) => {
              const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  onClick={onNavigate}
                  className={`relative flex w-full items-center gap-[11px] rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-accent/10 text-fg before:absolute before:-left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:rounded-r before:bg-accent before:content-['']"
                      : "text-fg-muted hover:bg-accent/5 hover:text-fg"
                  }`}
                >
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <AdminIcon name={it.icon} size={16} />
                  </span>
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line p-3">
        <div
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#0a0806]"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">
            {me?.fullName || "Admin"}
          </div>
          <div className="text-[11px] text-fg-dim">Administrator</div>
        </div>
      </div>
    </aside>
  );
}
