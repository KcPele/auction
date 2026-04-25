"use client";
import { AdminIcon, type AdminIconName } from "../primitives/Icon";

interface PageContent {
  icon: AdminIconName;
  title: string;
  sub: string;
  cta: string;
}

const PAGE_CONTENT: Record<string, PageContent> = {
  "access-codes": {
    icon: "key",
    title: "Access code requests",
    sub: "Pending applications — review documents, issue car/gadget codes, and unlock lister dashboards.",
    cta: "Open review queue",
  },
  listings: {
    icon: "check",
    title: "Listing approvals",
    sub: "Listings awaiting approval. Verify mechanic reports for cars, and proof-of-ownership documents for gadgets.",
    cta: "Review next listing",
  },
  auctions: {
    icon: "radio",
    title: "Live auctions monitor",
    sub: "Monitor all running auctions in real time. Intervene on suspicious bidding, extend auctions, or cancel with full hold release.",
    cta: "Open monitor",
  },
  disputes: {
    icon: "alert",
    title: "Disputes & chargebacks",
    sub: "Open disputes. Review ledger history, communicate with both parties, and resolve against the record.",
    cta: "View open cases",
  },
  users: {
    icon: "users",
    title: "Users & wallets",
    sub: "Registered users. Search profiles, inspect wallets, freeze accounts, or manually adjust holds with a full audit trail.",
    cta: "Browse users",
  },
  mechanics: {
    icon: "wrench",
    title: "Mechanics directory",
    sub: "Registered mechanics who inspect cars before listing. Add new mechanics, review their verification history, or revoke access.",
    cta: "Manage mechanics",
  },
  payments: {
    icon: "receipt",
    title: "Payments & ledger",
    sub: "Every wallet movement as a ledger entry. Reconcile OPay settlements, export financial reports, investigate anomalies.",
    cta: "Open ledger",
  },
  notifications: {
    icon: "bell",
    title: "Notifications log",
    sub: "Email (Resend) and WhatsApp (Business API) delivery status. Inspect failed deliveries, re-queue retries, audit template changes.",
    cta: "Open log",
  },
  settings: {
    icon: "sliders",
    title: "Platform settings",
    sub: "Hold percentage range, payment window, fee structure, notification templates, admin team, and role permissions.",
    cta: "Edit settings",
  },
};

export function PlaceholderScreen({ section }: { section: string }) {
  const p = PAGE_CONTENT[section];
  if (!p) return null;
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-[32px]">
          {p.title}
        </h1>
        <div className="mt-1 text-[13px] text-fg-muted">{p.sub}</div>
      </div>
      <div
        className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-line-strong p-10 text-center sm:p-20"
        style={{ background: "linear-gradient(180deg, var(--surface), transparent)" }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <AdminIcon name={p.icon} size={22} />
        </div>
        <h2 className="mb-1.5 font-display text-xl font-semibold sm:text-[22px]">{p.title}</h2>
        <p className="mb-5 max-w-md text-sm text-fg-muted">{p.sub}</p>
        <button
          type="button"
          className="rounded-md border border-transparent px-4 py-2 text-xs font-semibold text-[#1a0a00] hover:shadow-lg hover:shadow-accent/30"
          style={{ background: "linear-gradient(180deg, var(--accent-2), var(--accent))" }}
          onClick={() => alert(`${p.title} coming next`)}
        >
          {p.cta}
        </button>
      </div>
    </>
  );
}
