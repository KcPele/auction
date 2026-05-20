"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  useBanUser,
  useAdminUsers,
  useUnbanUser,
} from "@/app/components/admin/hooks/use-admin-users";
import { useGrantListingPermission } from "@/app/components/admin/hooks/use-admin-listings";
import type {
  AdminUserItem,
  AdminUserStatus,
} from "@/app/components/admin/types/users.types";
import { ApiError } from "@/app/lib/api/error";
import { Card, CardBody, CardHead } from "../widgets/Card";
import { Modal } from "../../ui/Modal";
import { fmtNGN } from "../utils";
import { SectionHeader } from "./SectionHeader";

const STATUS_OPTS: { id: "all" | AdminUserStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "banned", label: "Banned" },
];

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });

export function UsersScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AdminUserStatus>("all");
  const [granting, setGranting] = useState<AdminUserItem | null>(null);
  const [grantCategory, setGrantCategory] = useState<"cars" | "gadgets">("cars");
  const [banning, setBanning] = useState<AdminUserItem | null>(null);
  const [banReason, setBanReason] = useState("");

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    limit: 50,
  });
  const grant = useGrantListingPermission();
  const ban = useBanUser();
  const unban = useUnbanUser();

  const items = data?.items ?? [];

  const onGrant = async () => {
    if (!granting) return;
    try {
      await grant.mutateAsync({
        userId: granting.id,
        category: grantCategory,
      });
      toast.success("Listing access granted");
      setGranting(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not grant access");
    }
  };

  const onBan = async () => {
    if (!banning) return;
    try {
      await ban.mutateAsync({ id: banning.id, reason: banReason });
      toast.success("User banned");
      setBanning(null);
      setBanReason("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not ban user");
    }
  };

  const onUnban = async (u: AdminUserItem) => {
    try {
      await unban.mutateAsync(u.id);
      toast.success("User unbanned");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not unban");
    }
  };

  return (
    <>
      <SectionHeader
        title="Users & wallets"
        sub="Search profiles, inspect wallets, ban accounts, and manually grant listing access."
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatus(s.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                status === s.id
                  ? "border border-accent bg-accent/[0.12] text-accent"
                  : "border border-line bg-surface text-fg-muted hover:bg-surface-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-64 rounded-md border border-line bg-surface px-3 py-1.5 text-xs outline-none placeholder:text-fg-dim focus:border-accent/40"
        />
      </div>

      <Card>
        <CardHead title={`Users · ${data?.total ?? 0}`} />
        <CardBody flush>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] italic text-fg-dim">
              No users match.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    {[
                      "User",
                      "Joined",
                      "Balance",
                      "On hold",
                      "Role",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-line bg-bg-1 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim sm:px-[18px] ${
                          i === 2 || i === 3 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2/40">
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <div className="text-[13px] font-medium">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-fg-dim">
                          {u.email} · {u.phone}
                        </div>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-xs text-fg-muted sm:px-[18px]">
                        {dateFmt.format(u.createdAt)}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-right font-mono text-[13px] sm:px-[18px]">
                        {fmtNGN(u.walletBalance)}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-right font-mono text-[13px] text-accent sm:px-[18px]">
                        {u.walletHold ? fmtNGN(u.walletHold) : "—"}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-[12px] uppercase text-fg-muted sm:px-[18px]">
                        {u.role.replace("_", " ").toLowerCase()}
                      </td>
                      <td className="border-b border-line px-3.5 py-3 sm:px-[18px]">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            u.isBanned
                              ? "border-red/30 bg-red/[0.08] text-red"
                              : "border-green/30 bg-green/[0.08] text-green"
                          }`}
                        >
                          {u.isBanned ? "banned" : "active"}
                        </span>
                      </td>
                      <td className="border-b border-line px-3.5 py-3 text-right sm:px-[18px]">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setGranting(u)}
                            className="rounded-md border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-accent/40 hover:text-accent"
                          >
                            Grant
                          </button>
                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => onUnban(u)}
                              disabled={unban.isPending}
                              className="rounded-md border border-green/30 bg-green/[0.08] px-2.5 py-1 text-[11px] font-semibold text-green hover:bg-green/15 disabled:opacity-60"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setBanning(u);
                                setBanReason("");
                              }}
                              className="rounded-md border border-red/30 px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/10"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!granting}
        onClose={() => setGranting(null)}
        title={granting ? `Grant listing access · ${granting.fullName}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setGranting(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={grant.isPending}
              onClick={onGrant}
              className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-60"
            >
              {grant.isPending ? "Granting…" : "Grant access"}
            </button>
          </>
        }
      >
        <p className="mb-4 text-[13px] text-fg-muted">
          Bypass the application flow and grant listing access directly. Use
          this when you&apos;ve verified the user out-of-band.
        </p>
        <label className="block text-xs font-medium text-fg-muted">
          Category
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["cars", "gadgets"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setGrantCategory(c)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${
                grantCategory === c
                  ? "border-accent bg-accent/[0.08] text-accent"
                  : "border-line bg-surface text-fg-muted hover:bg-surface-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!banning}
        onClose={() => setBanning(null)}
        title={banning ? `Ban · ${banning.fullName}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setBanning(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={ban.isPending || !banReason.trim()}
              onClick={onBan}
              className="rounded-md border border-red/30 bg-red/[0.08] px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15 disabled:opacity-60"
            >
              {ban.isPending ? "Banning…" : "Confirm ban"}
            </button>
          </>
        }
      >
        <label className="block text-xs font-medium text-fg-muted">
          Reason
        </label>
        <textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          rows={3}
          placeholder="e.g. fraudulent bidding"
          className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
      </Modal>
    </>
  );
}
