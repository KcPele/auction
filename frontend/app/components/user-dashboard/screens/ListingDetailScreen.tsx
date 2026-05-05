"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type Category = "car" | "gadget";
type Status = "draft" | "pending" | "approved" | "rejected";

interface ListingView {
  title: string;
  status: Status;
  fields: { label: string; value: string }[];
}

interface Props {
  id: string;
}

export function ListingDetailScreen({ id }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const category = (params.get("category") ?? "car") as Category;

  // Integration: GET /api/v1/cars/{id}  or  GET /api/v1/gadgets/{id}
  const data: ListingView = category === "car" ? MOCK_CAR : MOCK_GADGET;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/listings")}
          className="inline-flex items-center gap-1.5 text-fg-muted"
        >
          <Icon name="chevron-l" size={14} /> Back
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-[26px] font-semibold leading-tight tracking-tight">
            {data.title}
          </h1>
          <div className="mt-1 text-[13px] text-fg-muted">
            {category === "car" ? "Car" : "Gadget"} listing · ID {id}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            data.status === "approved"
              ? "bg-green/[0.12] text-green"
              : data.status === "pending"
                ? "bg-accent/[0.12] text-accent"
                : data.status === "rejected"
                  ? "bg-red/[0.12] text-red"
                  : "bg-surface-2 text-fg-muted"
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[14px] border border-line bg-surface">
        {data.fields.map((f) => (
          <div
            key={f.label}
            className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <div className="w-40 flex-shrink-0 text-[11px] uppercase tracking-[0.08em] text-fg-dim">
              {f.label}
            </div>
            <div className="text-[13px] text-fg">{f.value}</div>
          </div>
        ))}
      </div>

      {(data.status === "draft" || data.status === "rejected") && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/listings/${id}/edit?category=${category}`}
            className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Edit
          </Link>
        </div>
      )}
    </>
  );
}

const MOCK_CAR: ListingView = {
  title: "2018 Toyota Camry SE",
  status: "approved",
  fields: [
    { label: "Make", value: "Toyota" },
    { label: "Model", value: "Camry SE" },
    { label: "Year", value: "2018" },
    { label: "Colour", value: "Black" },
    { label: "Registration", value: "ABC-123-LA" },
    { label: "Mileage", value: "68,000 km" },
    { label: "Condition", value: "Good" },
    { label: "Known faults", value: "AC needs servicing." },
    { label: "Mechanic", value: "K. Adebayo · MCH-021" },
    { label: "Base price", value: fmtNaira(8_500_000) },
    { label: "Hold", value: "10%" },
    { label: "Bid increment", value: fmtNaira(50_000) },
    { label: "Duration", value: "120 minutes" },
  ],
};

const MOCK_GADGET: ListingView = {
  title: "iPhone 15 Pro · 256GB",
  status: "pending",
  fields: [
    { label: "Type", value: "Phone" },
    { label: "Brand", value: "Apple" },
    { label: "Model", value: "iPhone 15 Pro" },
    { label: "Colour", value: "Natural Titanium" },
    { label: "Battery", value: "92%" },
    { label: "Specs", value: "256GB · A17 Pro" },
    { label: "Usage", value: "Personal · 6 months" },
    { label: "Defects", value: "Hairline scratch on side." },
    { label: "Proof", value: "Receipt · Slot Ikeja" },
    { label: "Base price", value: fmtNaira(950_000) },
    { label: "Hold", value: "10%" },
    { label: "Bid increment", value: fmtNaira(10_000) },
    { label: "Duration", value: "60 minutes" },
  ],
};
