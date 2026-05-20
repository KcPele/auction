"use client";
import { useState } from "react";
import type { AdminPendingListing } from "@/app/components/admin/types/listings.types";
import type {
  CarListingDto,
  GadgetListingDto,
} from "@/app/components/listings/types/listing.types";
import { Modal } from "../../ui/Modal";
import { AdminIcon } from "../primitives/Icon";
import { fmtNGN } from "../utils";

interface Props {
  listing: AdminPendingListing | null;
  onClose: () => void;
  onApprove: (input: { listing: AdminPendingListing; reviewNote?: string }) => void;
  onReject: (input: { listing: AdminPendingListing; reviewNote?: string }) => void;
  isPending?: boolean;
}

const KIND_TAG: Record<"cars" | "gadgets", string> = {
  cars: "text-accent-2 bg-accent-2/[0.06] border-accent-2/20",
  gadgets: "text-[#a2c9ff] bg-[#a2c9ff]/[0.06] border-[#a2c9ff]/20",
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
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

export function ListingReviewDialog({
  listing,
  onClose,
  onApprove,
  onReject,
  isPending,
}: Props) {
  const [note, setNote] = useState("");

  if (!listing) return null;

  const a = listing;
  const car =
    a.category === "cars" ? (a.raw as CarListingDto) : null;
  const gadget =
    a.category === "gadgets" ? (a.raw as GadgetListingDto) : null;

  return (
    <Modal
      open={!!listing}
      onClose={onClose}
      widthClass="max-w-2xl"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TAG[a.category]}`}
          >
            {a.category === "cars" ? "car" : "gadget"}
          </span>
          <span className="font-mono text-[11px] text-fg-dim">
            {a.id.slice(0, 8)}
          </span>
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
            disabled={isPending}
            onClick={() => onReject({ listing: a, reviewNote: note || undefined })}
            className="rounded-md border border-red/30 bg-transparent px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/10 disabled:opacity-60"
          >
            Deny
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onApprove({ listing: a, reviewNote: note || undefined })}
            className="rounded-md border border-green/30 bg-green/[0.08] px-3 py-1.5 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-60"
          >
            Approve
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line text-[rgba(255,200,140,0.5)]"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(255,170,90,0.04) 0 8px, rgba(255,170,90,0.08) 8px 16px), linear-gradient(180deg, #3a2d1f, #231810)",
          }}
        >
          {a.photoUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.photoUrls[0]}
              alt={a.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <AdminIcon
              name={a.category === "cars" ? "car" : "phone"}
              size={28}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight">
            {a.title}
          </h2>
          <div className="mt-1 text-xs text-fg-muted">
            Submitted{" "}
            {a.createdAt.toLocaleDateString("en-NG", {
              dateStyle: "medium",
            })}{" "}
            · {a.photoUrls.length} photo
            {a.photoUrls.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {a.photoUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {a.photoUrls.slice(0, 6).map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={u}
              src={u}
              alt=""
              className="aspect-square w-full rounded border border-line object-cover"
            />
          ))}
        </div>
      )}

      <div className="grid gap-2.5 rounded-lg border border-line bg-bg-1 p-4">
        <DetailRow label="Base price" value={fmtNGN(a.basePrice)} />
        <DetailRow label="Hold" value={`${a.holdPercent}%`} />
        <DetailRow
          label="Min increment"
          value={fmtNGN(a.minimumBidIncrement)}
        />
        <DetailRow label="Duration" value={`${a.durationMinutes} min`} />
        <DetailRow
          label="Starts"
          value={a.startTime.toLocaleString("en-NG", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        />

        {car && (
          <>
            <DetailRow label="Make" value={car.make} />
            <DetailRow label="Model" value={car.model} />
            <DetailRow label="Year" value={car.year} />
            <DetailRow label="Mileage" value={`${car.mileage} km`} />
            <DetailRow label="Registration" value={car.registrationNumber} />
            <DetailRow label="Condition" value={car.condition} />
            <DetailRow label="Faults" value={car.knownFaults} />
          </>
        )}

        {gadget && (
          <>
            <DetailRow label="Type" value={gadget.type} />
            <DetailRow label="Brand" value={gadget.brand} />
            <DetailRow label="Model" value={gadget.model} />
            <DetailRow label="Colour" value={gadget.colour} />
            <DetailRow
              label="Battery"
              value={
                gadget.batteryHealthPercent !== null
                  ? `${gadget.batteryHealthPercent}%`
                  : null
              }
            />
            <DetailRow label="Usage" value={gadget.usageHistory} />
            <DetailRow label="Defects" value={gadget.defects} />
            <DetailRow label="Proof" value={gadget.proofDocumentUrl} />
          </>
        )}
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-[11px] uppercase tracking-[0.08em] text-fg-dim">
          Review note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Reason for approval / rejection (visible to lister)"
          className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none focus:border-accent placeholder:text-fg-dim"
        />
      </div>
    </Modal>
  );
}
