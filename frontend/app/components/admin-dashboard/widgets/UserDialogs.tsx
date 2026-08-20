"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGrantListingPermission } from "@/app/components/admin/hooks/use-admin-listings";
import {
  useAdminUserWallet,
  useBanUser,
} from "@/app/components/admin/hooks/use-admin-users";
import type { AdminUserItem } from "@/app/components/admin/types/users.types";
import { ApiError } from "@/app/lib/api/error";
import { Modal } from "../../ui/Modal";
import { fmtNGN } from "../utils";

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" });

export function UserWalletDialog({
  user,
  onClose,
}: {
  user: AdminUserItem | null;
  onClose: () => void;
}) {
  const wallet = useAdminUserWallet(user?.id);
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title={user ? `Wallet · ${user.fullName}` : "Wallet"}
      widthClass="max-w-2xl"
    >
      {wallet.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading wallet…</p>
      ) : wallet.isError ? (
        <div className="py-8 text-center">
          <p className="text-sm text-danger">Could not load this wallet.</p>
          <button type="button" onClick={() => wallet.refetch()} className="mt-2 text-xs font-semibold text-primary">
            Retry
          </button>
        </div>
      ) : wallet.data ? (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <WalletStat label="Available balance" value={wallet.data.balance} />
            <WalletStat label="Funds on hold" value={wallet.data.hold} warning />
          </dl>
          <div>
            <h3 className="text-sm font-semibold">Recent activity</h3>
            {wallet.data.ledger.length === 0 ? (
              <p className="mt-3 rounded-lg border border-border bg-surface-subtle p-4 text-center text-sm text-muted-foreground">
                No wallet activity yet.
              </p>
            ) : (
              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-xs">
                  <thead><tr className="bg-surface-subtle text-left text-muted-foreground"><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 text-right font-medium">Amount</th><th className="px-3 py-2 text-right font-medium">Date</th></tr></thead>
                  <tbody>{wallet.data.ledger.map((entry) => (
                    <tr key={entry.id} className="border-t border-border">
                      <td className="px-3 py-2"><div className="font-medium">{entry.type.replaceAll("_", " ").toLowerCase()}</div>{entry.reference && <div className="mt-0.5 font-mono text-xs text-subtle-foreground">{entry.reference}</div>}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{fmtNGN(entry.amount)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{dateFmt.format(entry.createdAt)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function WalletStat({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface-subtle p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-mono text-lg font-semibold ${warning ? "text-warning" : "text-foreground"}`}>{fmtNGN(value)}</dd>
    </div>
  );
}

export function GrantAccessDialog({ user, onClose }: { user: AdminUserItem | null; onClose: () => void }) {
  const [category, setCategory] = useState<"cars" | "gadgets">("cars");
  const grant = useGrantListingPermission();
  const submit = async () => {
    if (!user) return;
    try {
      await grant.mutateAsync({ userId: user.id, category });
      toast.success("Listing access granted");
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not grant access");
    }
  };
  return (
    <Modal open={Boolean(user)} onClose={onClose} title={user ? `Grant listing access · ${user.fullName}` : ""} widthClass="max-w-md" footer={<DialogActions onClose={onClose} onConfirm={submit} pending={grant.isPending} confirmLabel="Grant access" pendingLabel="Granting…" tone="success" />}>
      <p className="mb-4 text-sm text-muted-foreground">Bypass the application flow only after verifying the user out-of-band.</p>
      <span className="block text-xs font-medium text-muted-foreground">Category</span>
      <div className="mt-2 grid grid-cols-2 gap-2">{(["cars", "gadgets"] as const).map((value) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${category === value ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground hover:bg-surface-subtle"}`}>{value}</button>)}</div>
    </Modal>
  );
}

export function BanUserDialog({ user, onClose }: { user: AdminUserItem | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const ban = useBanUser();
  const close = () => { setReason(""); onClose(); };
  const submit = async () => {
    if (!user || !reason.trim()) return;
    try {
      await ban.mutateAsync({ id: user.id, reason });
      toast.success("User banned");
      close();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not ban user");
    }
  };
  return (
    <Modal open={Boolean(user)} onClose={close} title={user ? `Ban · ${user.fullName}` : ""} widthClass="max-w-md" footer={<DialogActions onClose={close} onConfirm={submit} pending={ban.isPending} disabled={!reason.trim()} confirmLabel="Confirm ban" pendingLabel="Banning…" tone="danger" />}>
      <label htmlFor="ban-reason" className="block text-xs font-medium text-muted-foreground">Reason</label>
      <textarea id="ban-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="e.g. fraudulent bidding" className="mt-1.5 w-full resize-none rounded-md border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-primary" />
    </Modal>
  );
}

function DialogActions({ onClose, onConfirm, pending, disabled = false, confirmLabel, pendingLabel, tone }: { onClose: () => void; onConfirm: () => void; pending: boolean; disabled?: boolean; confirmLabel: string; pendingLabel: string; tone: "success" | "danger" }) {
  const confirmClass = tone === "danger" ? "border-danger/30 bg-danger-soft text-danger hover:border-danger" : "border-success/30 bg-success-soft text-success hover:border-success";
  return <><button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-subtle">Cancel</button><button type="button" disabled={pending || disabled} onClick={onConfirm} className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${confirmClass}`}>{pending ? pendingLabel : confirmLabel}</button></>;
}
