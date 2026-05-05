"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "../primitives/Icon";

type Category = "car" | "gadget";

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

const inputClass =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim";
const labelClass = "mb-1 block text-xs font-medium text-fg-muted";

interface Props {
  id: string;
}

export function EditListingScreen({ id }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const category = (params.get("category") ?? "car") as Category;

  // Integration: hydrate from GET /api/v1/cars/{id} or GET /api/v1/gadgets/{id}
  const [form, setForm] = useState(() =>
    category === "car"
      ? {
          make: "Toyota",
          model: "Camry",
          year: "2018",
          colour: "Black",
          reg: "ABC-123-LA",
          mileage: "68000",
          condition: "Good",
          faults: "AC needs servicing.",
          basePriceNaira: 8_500_000,
          holdPercent: 10,
          minimumBidIncrementNaira: 50_000,
          startTime: "",
          durationMinutes: 120,
        }
      : {
          type: "Phone",
          brand: "Apple",
          model: "iPhone 15 Pro",
          colour: "Natural Titanium",
          batteryHealthPercent: 92,
          specs: "256GB · A17 Pro",
          usage: "Personal · 6 months",
          defects: "Hairline scratch on side.",
          proofDocumentUrl: "https://cdn.example.com/receipt.pdf",
          basePriceNaira: 950_000,
          holdPercent: 10,
          minimumBidIncrementNaira: 10_000,
          startTime: "",
          durationMinutes: 60,
        },
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = (submit: boolean) => {
    // Integration:
    //   PATCH /api/v1/cars/{id}   or   PATCH /api/v1/gadgets/{id}
    // Convert *Naira fields to *Kobo before sending.
    // If submit=true, also POST /api/v1/cars/{id}/submit or /api/v1/gadgets/{id}/submit afterwards.
    console.log("save", { id, category, submit, form });
    router.push("/dashboard/listings");
  };

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
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Edit listing</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {category === "car" ? "Car" : "Gadget"} · ID {id}
      </p>

      {category === "car" ? (
        <CarFields form={form as never} set={set as never} />
      ) : (
        <GadgetFields form={form as never} set={set as never} />
      )}

      <PricingFields form={form as never} set={set as never} />

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => save(false)}
          className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-fg hover:bg-surface-2"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          className="rounded-xl px-5 py-3 text-sm font-bold text-[#1a0a00]"
          style={PRIMARY_BTN_BG}
        >
          Save & resubmit
        </button>
      </div>
    </>
  );
}

interface FieldGroupProps<T> {
  form: T;
  set: <K extends keyof T>(k: K, v: T[K]) => void;
}

function CarFields({
  form,
  set,
}: FieldGroupProps<{
  make: string;
  model: string;
  year: string;
  colour: string;
  reg: string;
  mileage: string;
  condition: string;
  faults: string;
}>) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Text label="Make" value={form.make} onChange={(v) => set("make", v)} />
      <Text label="Model" value={form.model} onChange={(v) => set("model", v)} />
      <Text label="Year" value={form.year} onChange={(v) => set("year", v)} />
      <Text label="Colour" value={form.colour} onChange={(v) => set("colour", v)} />
      <Text label="Registration" value={form.reg} onChange={(v) => set("reg", v)} />
      <Text label="Mileage (km)" value={form.mileage} onChange={(v) => set("mileage", v)} />
      <Text label="Condition" value={form.condition} onChange={(v) => set("condition", v)} />
      <div className="sm:col-span-2">
        <label className={labelClass}>Known faults</label>
        <textarea
          value={form.faults}
          onChange={(e) => set("faults", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function GadgetFields({
  form,
  set,
}: FieldGroupProps<{
  type: string;
  brand: string;
  model: string;
  colour: string;
  batteryHealthPercent: number;
  specs: string;
  usage: string;
  defects: string;
  proofDocumentUrl: string;
}>) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Text label="Type" value={form.type} onChange={(v) => set("type", v)} />
      <Text label="Brand" value={form.brand} onChange={(v) => set("brand", v)} />
      <Text label="Model" value={form.model} onChange={(v) => set("model", v)} />
      <Text label="Colour" value={form.colour} onChange={(v) => set("colour", v)} />
      <Number
        label="Battery health (%)"
        value={form.batteryHealthPercent}
        onChange={(v) => set("batteryHealthPercent", v)}
      />
      <Text label="Specs (short summary)" value={form.specs} onChange={(v) => set("specs", v)} />
      <div className="sm:col-span-2">
        <label className={labelClass}>Usage history</label>
        <textarea
          value={form.usage}
          onChange={(e) => set("usage", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Defects</label>
        <textarea
          value={form.defects}
          onChange={(e) => set("defects", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>
      <Text
        label="Proof document URL"
        value={form.proofDocumentUrl}
        onChange={(v) => set("proofDocumentUrl", v)}
      />
    </div>
  );
}

function PricingFields({
  form,
  set,
}: FieldGroupProps<{
  basePriceNaira: number;
  holdPercent: number;
  minimumBidIncrementNaira: number;
  startTime: string;
  durationMinutes: number;
}>) {
  return (
    <div className="mt-6">
      <h2 className="text-[15px] font-semibold tracking-tight">Pricing</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Number
          label="Base price (₦)"
          value={form.basePriceNaira}
          onChange={(v) => set("basePriceNaira", v)}
        />
        <Number
          label="Bid hold (%)"
          value={form.holdPercent}
          onChange={(v) => set("holdPercent", v)}
        />
        <Number
          label="Minimum bid increment (₦)"
          value={form.minimumBidIncrementNaira}
          onChange={(v) => set("minimumBidIncrementNaira", v)}
        />
        <Number
          label="Duration (minutes)"
          value={form.durationMinutes}
          onChange={(v) => set("durationMinutes", v)}
        />
        <div className="sm:col-span-2">
          <label className={labelClass}>Start time</label>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function Number({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={inputClass}
      />
    </div>
  );
}
