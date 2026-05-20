"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminAuctions } from "@/app/components/admin/hooks/use-admin-dashboard";
import {
  useDefaultAuctionPayment,
  useSettleAuctionPayment,
} from "@/app/components/admin/hooks/use-admin-settlements";
import type { AdminAuctionItem } from "@/app/components/admin/types/dashboard.types";
import { ApiError } from "@/app/lib/api/error";
import { Modal } from "../../ui/Modal";
import { fmtNGN } from "../utils";
import { SectionHeader } from "./SectionHeader";

export function SettlementScreen() {
  const { data, isLoading, isError, refetch } = useAdminAuctions({
    status: "AWAITING_PAYMENT",
    limit: 50,
  });
  const settle = useSettleAuctionPayment();
  const markDefault = useDefaultAuctionPayment();

  const [settlingFor, setSettlingFor] = useState<AdminAuctionItem | null>(null);
  const [externalNaira, setExternalNaira] = useState<number>(0);
  const [walletNaira, setWalletNaira] = useState<number>(0);
  const [note, setNote] = useState("");

  const [defaultingFor, setDefaultingFor] = useState<AdminAuctionItem | null>(
    null,
  );
  const [reason, setReason] = useState("");

  const items = data?.items ?? [];

  const onSettle = async () => {
    if (!settlingFor) return;
    if (externalNaira <= 0 && walletNaira <= 0) {
      toast.error("Enter at least one payment amount");
      return;
    }
    try {
      await settle.mutateAsync({
        id: settlingFor.id,
        externalPaymentNaira: externalNaira || undefined,
        walletPaymentNaira: walletNaira || undefined,
        note: note || undefined,
      });
      toast.success("Auction settled");
      setSettlingFor(null);
      setExternalNaira(0);
      setWalletNaira(0);
      setNote("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not settle");
    }
  };

  const onDefault = async () => {
    if (!defaultingFor) return;
    try {
      await markDefault.mutateAsync({
        id: defaultingFor.id,
        reason: reason || undefined,
      });
      toast.success("Auction defaulted");
      setDefaultingFor(null);
      setReason("");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not mark defaulted");
    }
  };

  return (
    <>
      <SectionHeader
        title="Settlements"
        sub="Auctions awaiting payment confirmation. Settle (release escrow) or mark defaulted (forfeit hold)."
      />

      {isLoading ? (
        <div className="mt-8 text-center text-sm text-fg-muted">Loading…</div>
      ) : isError ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-fg-muted">Could not load.</p>
          <button onClick={() => refetch()} className="mt-2 text-xs text-accent">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 text-center text-sm text-fg-muted">
          No auctions awaiting settlement.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((s) => (
            <div
              key={s.id}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[14px] font-semibold">{s.title}</div>
                  <div className="mt-0.5 text-xs text-fg-dim">
                    {s.id.slice(0, 8)} · {s.bidderCount} bidders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[16px] font-bold text-accent">
                    {fmtNGN(s.currentBid)}
                  </div>
                  <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                    {s.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettlingFor(s);
                    setExternalNaira(s.currentBid);
                    setWalletNaira(0);
                  }}
                  className="flex-1 rounded-lg border-none p-2 text-xs font-bold text-[#1a0a00]"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--accent-2), var(--accent))",
                  }}
                >
                  Settle &amp; release escrow
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultingFor(s)}
                  className="flex-1 rounded-lg border border-red/30 bg-red/[0.08] p-2 text-xs font-semibold text-red"
                >
                  Mark defaulted
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!settlingFor}
        onClose={() => setSettlingFor(null)}
        title={settlingFor ? `Settle · ${settlingFor.title}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSettlingFor(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={settle.isPending}
              onClick={onSettle}
              className="rounded-md border-none px-3 py-1.5 text-xs font-bold text-[#1a0a00] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(180deg, var(--accent-2), var(--accent))",
              }}
            >
              {settle.isPending ? "Settling…" : "Confirm settle"}
            </button>
          </>
        }
      >
        <p className="mb-3 text-[12px] text-fg-muted">
          Split the winner&apos;s payment between an external transfer (already
          received) and any wallet hold to apply.
        </p>
        <label className="mb-1 block text-xs font-medium text-fg-muted">
          External payment (₦)
        </label>
        <input
          type="number"
          value={externalNaira || ""}
          onChange={(e) => setExternalNaira(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
        />
        <label className="mb-1 mt-3 block text-xs font-medium text-fg-muted">
          Wallet payment (₦)
        </label>
        <input
          type="number"
          value={walletNaira || ""}
          onChange={(e) => setWalletNaira(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
        />
        <label className="mb-1 mt-3 block text-xs font-medium text-fg-muted">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
      </Modal>

      <Modal
        open={!!defaultingFor}
        onClose={() => setDefaultingFor(null)}
        title={defaultingFor ? `Default · ${defaultingFor.title}` : ""}
        widthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDefaultingFor(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={markDefault.isPending}
              onClick={onDefault}
              className="rounded-md border border-red/30 bg-red/[0.08] px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15 disabled:opacity-60"
            >
              {markDefault.isPending ? "Marking…" : "Confirm default"}
            </button>
          </>
        }
      >
        <p className="mb-3 text-[12px] text-fg-muted">
          Marking as defaulted forfeits the winner&apos;s hold and frees the
          listing for relisting.
        </p>
        <label className="mb-1 block text-xs font-medium text-fg-muted">
          Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
      </Modal>
    </>
  );
}
