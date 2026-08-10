"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { useUnreadCount } from "@/app/components/notifications/hooks/use-notifications";
import { useGreeting } from "@/app/lib/format/use-greeting";
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
  "sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur-md lg:hidden";
const ICON_BTN_CLASS =
  "relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-fg-muted hover:border-line-strong hover:bg-surface hover:text-fg";

export function MobileHeader() {
  const router = useRouter();
  const path = usePathname() || "/dashboard";
  const backTitle = backInfo(path);
  const { data: me } = useMe();
  const { data: unread = 0 } = useUnreadCount();
  const greeting = useGreeting();
  const initials = me
    ? `${me.firstName[0] ?? ""}${me.lastName[0] ?? ""}`.toUpperCase()
    : "";

  const shareCurrentPage = async () => {
    const shareData = { title: document.title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  };

  if (path === "/dashboard/notifications") {
    return (
      <div className={HEADER_CLASS}>
        <button className={ICON_BTN_CLASS} onClick={() => router.back()} type="button">
          <Icon name="chevron-l" size={20} />
        </button>
        <div className="flex-1 text-center text-sm font-semibold">Notifications</div>
        <Link
          href="/dashboard/profile#notification-preferences"
          className={ICON_BTN_CLASS}
          aria-label="Notification settings"
        >
          <Icon name="settings" size={18} />
        </Link>
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
        <button
          className={ICON_BTN_CLASS}
          onClick={shareCurrentPage}
          type="button"
          aria-label="Share this page"
        >
          <Icon name="share" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className={HEADER_CLASS}>
      <div
        className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
      >
        {initials || "·"}
      </div>
      <div className="flex-1">
        <div className="text-xs text-fg-dim">{greeting}</div>
        <div className="text-[15px] font-semibold">{me?.firstName ?? "—"}</div>
      </div>
      <div className="ml-auto flex gap-1.5">
        <Link href="/dashboard/notifications" className={ICON_BTN_CLASS}>
          <Icon name="bell" size={18} />
          {unread > 0 && (
            <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-red px-1 font-mono text-[9px] font-bold text-fg">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/support"
          className={ICON_BTN_CLASS}
          aria-label="Get help"
        >
          <Icon name="help" size={18} />
        </Link>
      </div>
    </div>
  );
}
