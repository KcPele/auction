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

const HEADER_CLASS =
  "sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[rgba(11,10,8,0.92)] px-[18px] pb-3 pt-4 backdrop-blur-md lg:hidden";
const ICON_BTN_CLASS =
  "relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg";

export function MobileHeader() {
  const router = useRouter();
  const path = usePathname() || "/dashboard";
  const backTitle = backInfo(path);

  if (path === "/dashboard/notifications") {
    return (
      <div className={HEADER_CLASS}>
        <button className={ICON_BTN_CLASS} onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={20} />
        </button>
        <div className="flex-1 text-center text-sm font-semibold">Notifications</div>
        <button className={ICON_BTN_CLASS} type="button">
          <Icon name="settings" size={18} />
        </button>
      </div>
    );
  }

  if (backTitle) {
    return (
      <div className={HEADER_CLASS}>
        <button className={ICON_BTN_CLASS} onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={20} />
        </button>
        <div className="flex-1 text-center text-sm font-semibold">{backTitle}</div>
        <Link href="/dashboard/notifications" className={ICON_BTN_CLASS}>
          <Icon name="share" size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className={HEADER_CLASS}>
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-bold text-[#0a0806]"
        style={{
          background:
            "linear-gradient(135deg, var(--accent), var(--accent-deep))",
        }}
      >
        AO
      </div>
      <div className="flex-1">
        <div className="text-xs text-fg-dim">Good afternoon</div>
        <div className="text-[15px] font-semibold">Adaeze</div>
      </div>
      <div className="ml-auto flex gap-1.5">
        <Link href="/dashboard/notifications" className={ICON_BTN_CLASS}>
          <Icon name="bell" size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-bg bg-red" />
        </Link>
        <button className={ICON_BTN_CLASS} type="button">
          <Icon name="help" size={18} />
        </button>
      </div>
    </div>
  );
}
