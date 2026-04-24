"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "../primitives/Icon";

const BACK_TITLES: Array<[string, string]> = [
  ["/dashboard/auction/", "Auction"],
  ["/dashboard/wallet/topup", "Top up wallet"],
  ["/dashboard/bids", "My bids"],
];

function backInfo(path: string) {
  for (const [prefix, title] of BACK_TITLES) {
    if (path.startsWith(prefix)) return title;
  }
  return null;
}

export function MobileHeader() {
  const router = useRouter();
  const path = usePathname() || "/dashboard";
  const backTitle = backInfo(path);

  if (path === "/dashboard/notifications") {
    return (
      <div className="dash-header">
        <button className="dash-icon-btn" onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={20} />
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Notifications
        </div>
        <button className="dash-icon-btn" type="button">
          <Icon name="settings" size={18} />
        </button>
      </div>
    );
  }

  if (backTitle) {
    return (
      <div className="dash-header">
        <button className="dash-icon-btn" onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={20} />
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          {backTitle}
        </div>
        <Link href="/dashboard/notifications" className="dash-icon-btn">
          <Icon name="share" size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-header">
      <div className="dash-header-avatar">AO</div>
      <div style={{ flex: 1 }}>
        <div className="dash-header-greet">Good afternoon</div>
        <div className="dash-header-name">Adaeze</div>
      </div>
      <div className="dash-header-icons">
        <Link href="/dashboard/notifications" className="dash-icon-btn">
          <Icon name="bell" size={18} />
          <span className="dash-icon-badge" />
        </Link>
        <button className="dash-icon-btn" type="button">
          <Icon name="help" size={18} />
        </button>
      </div>
    </div>
  );
}
