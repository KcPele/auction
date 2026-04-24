"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../primitives/Icon";
import { fmtNaira } from "../utils";
import { WALLET_BALANCE } from "../data";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  match?: (path: string) => boolean;
}

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
  { href: "/dashboard/browse", label: "Browse auctions", icon: "search" },
  { href: "/dashboard/bids", label: "My bids", icon: "gavel", badge: 2 },
  { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
];
const META: NavItem[] = [
  { href: "/dashboard/notifications", label: "Notifications", icon: "bell", badge: 2 },
  { href: "/dashboard/profile", label: "Profile & settings", icon: "user" },
];

function isActive(item: NavItem, path: string) {
  if (item.match) return item.match(path);
  return path === item.href || path.startsWith(item.href + "/");
}

function NavList({ items, path }: { items: NavItem[]; path: string }) {
  return (
    <nav className="dash-side-nav">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`dash-side-item ${isActive(n, path) ? "active" : ""}`}
        >
          <Icon name={n.icon} size={18} /> {n.label}
          {n.badge && <span className="dash-side-item-badge">{n.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const path = usePathname() || "/dashboard";
  return (
    <aside className="dash-desktop-sidebar">
      <div className="dash-side-brand">
        <span className="font-display text-xl font-bold tracking-[-0.02em]">
          Bid<span className="italic accent-gradient-text">Naija</span>
        </span>
      </div>
      <div className="dash-side-nav-label">Auctions</div>
      <NavList items={MAIN} path={path} />
      <div className="dash-side-nav-label">Account</div>
      <NavList items={META} path={path} />
      <div className="dash-side-wallet">
        <div className="dash-side-wallet-lbl">Available to bid</div>
        <div className="dash-side-wallet-val">{fmtNaira(WALLET_BALANCE + 1_018_200)}</div>
        <Link href="/dashboard/wallet/topup" className="dash-side-wallet-btn">
          + Top up wallet
        </Link>
      </div>
    </aside>
  );
}
