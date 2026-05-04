"use client";
import { Modal } from "../../ui/Modal";
import { AdminIcon } from "../primitives/Icon";
import type { Approval } from "../types";
import { fmtNGN } from "../utils";

interface Props {
  approval: Approval | null;
  onClose: () => void;
  onApprove: (a: Approval) => void;
  onReject: (a: Approval) => void;
}

const KIND_TAG: Record<Approval["kind"], string> = {
  car: "text-accent-2 bg-accent-2/[0.06] border-accent-2/20",
  gadget: "text-[#a2c9ff] bg-[#a2c9ff]/[0.06] border-[#a2c9ff]/20",
};

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <div className="w-32 flex-shrink-0 text-[11px] uppercase tracking-[0.08em] text-fg-dim">
        {label}
      </div>
      <div className="text-[13px] text-fg">{value}</div>
    </div>
  );
}

export function ListingReviewDialog({ approval, onClose, onApprove, onReject }: Props) {
  if (!approval) return null;
  const a = approval;

  return (
    <Modal
      open={!!approval}
      onClose={onClose}
      widthClass="max-w-2xl"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TAG[a.kind]}`}
          >
            {a.kind}
          </span>
          {a.tag && (
            <span className="inline-flex items-center rounded border border-red/25 bg-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red">
              {a.tag}
            </span>
          )}
          <span className="font-mono text-[11px] text-fg-dim">{a.id}</span>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-transparent px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onReject(a)}
            className="rounded-md border border-red/30 bg-transparent px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/10"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => onApprove(a)}
            className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15"
          >
            Approve
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md border border-line text-[rgba(255,200,140,0.5)]"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.08) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
          }}
        >
          <AdminIcon name={a.kind === "car" ? "car" : "phone"} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight">{a.title}</h2>
          <div className="mt-1 text-xs text-fg-muted">
            Submitted by {a.by} · waited {a.waited} · {a.photos} photos
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 rounded-lg border border-line bg-bg-1 p-4">
        <DetailRow label="Base price" value={fmtNGN(a.basePrice)} />
        <DetailRow label="Year" value={a.year} />
        <DetailRow label="Location" value={a.location} />
        <DetailRow label="Mileage" value={a.mileage} />
        <DetailRow label="Reg. number" value={a.reg} />
        <DetailRow label="Mechanic" value={a.mechanic} />
        <DetailRow label="Faults" value={a.faults} />
        <DetailRow label="Battery" value={a.battery} />
        <DetailRow label="Specs" value={a.specs} />
        <DetailRow label="Usage" value={a.usage} />
        <DetailRow label="Proof" value={a.proof} />
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-line p-3 text-[11px] leading-relaxed text-fg-dim">
        Photo gallery and inspection report attachments will mount here once the backend
        exposes <span className="font-mono text-fg-muted">GET /admin/listings/{a.kind === "car" ? "CAR" : "GADGET"}/{a.id}</span>.
      </div>
    </Modal>
  );
}
