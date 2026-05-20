"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useCarListing,
  useGadgetListing,
  useSubmitListing,
  useUpdateCar,
  useUpdateGadget,
} from "@/app/components/listings/hooks/use-listings";
import type {
  CarListing,
  GadgetListing,
  UpdateCarInput,
  UpdateGadgetInput,
} from "@/app/components/listings/types/listing.types";
import { ApiError } from "@/app/lib/api/error";
import { Icon } from "../primitives/Icon";

type Category = "car" | "gadget";

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

const inputClass =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim";
const labelClass = "mb-1 block text-xs font-medium text-fg-muted";

export function EditListingScreen({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const category = (params.get("category") ?? "car") as Category;

  const car = useCarListing(category === "car" ? id : undefined);
  const gadget = useGadgetListing(category === "gadget" ? id : undefined);
  const updateCar = useUpdateCar(id);
  const updateGadget = useUpdateGadget(id);
  const submit = useSubmitListing();

  const query = category === "car" ? car : gadget;
  const listing = (category === "car" ? car.data : gadget.data) ?? null;

  const [form, setForm] = useState<EditFormState | null>(null);
  useEffect(() => {
    if (!listing) return;
    const frame = window.requestAnimationFrame(() => setForm(toFormState(listing)));
    return () => window.cancelAnimationFrame(frame);
  }, [listing]);

  if (query.isLoading || !form) {
    return <div className="py-10 text-center text-sm text-fg-dim">Loading…</div>;
  }
  if (query.isError || !listing) {
    return (
      <div className="py-10 text-center text-sm text-fg-dim">
        Could not load listing.
      </div>
    );
  }

  const set = <K extends keyof EditFormState>(k: K, v: EditFormState[K]) =>
    setForm((s) => (s ? { ...s, [k]: v } : s));

  const buildPatchCar = (): UpdateCarInput => ({
    make: form.make,
    model: form.model,
    year: Number(form.year),
    colour: form.colour,
    registrationNumber: form.reg,
    mileage: Number(form.mileage),
    condition: form.condition,
    knownFaults: form.faults || undefined,
    basePriceNaira: form.basePriceNaira,
    holdPercent: form.holdPercent,
    minimumBidIncrementNaira: form.minimumBidIncrementNaira,
    startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
    durationMinutes: form.durationMinutes,
  });

  const buildPatchGadget = (): UpdateGadgetInput => ({
    type: form.type,
    brand: form.brand,
    model: form.model,
    colour: form.colour,
    batteryHealthPercent: form.batteryHealthPercent,
    specs: form.specs ? parseSpecs(form.specs) : undefined,
    usageHistory: form.usage,
    defects: form.defects || undefined,
    proofDocumentUrl: form.proofDocumentUrl,
    basePriceNaira: form.basePriceNaira,
    holdPercent: form.holdPercent,
    minimumBidIncrementNaira: form.minimumBidIncrementNaira,
    startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
    durationMinutes: form.durationMinutes,
  });

  const onSave = async (resubmit: boolean) => {
    try {
      if (category === "car") {
        await updateCar.mutateAsync(buildPatchCar());
      } else {
        await updateGadget.mutateAsync(buildPatchGadget());
      }
      if (resubmit) {
        await submit.mutateAsync({ id, category: category === "car" ? "cars" : "gadgets" });
        toast.success("Listing resubmitted");
      } else {
        toast.success("Draft saved");
      }
      router.push("/dashboard/listings");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Could not save");
    }
  };

  const isPending =
    updateCar.isPending || updateGadget.isPending || submit.isPending;

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
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">
        Edit listing
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {category === "car" ? "Car" : "Gadget"}
      </p>

      {category === "car" ? (
        <CarFields form={form} set={set} />
      ) : (
        <GadgetFields form={form} set={set} />
      )}
      <PricingFields form={form} set={set} />

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSave(false)}
          className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-60"
        >
          {updateCar.isPending || updateGadget.isPending ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSave(true)}
          className="rounded-xl px-5 py-3 text-sm font-bold text-[#1a0a00] disabled:opacity-60"
          style={PRIMARY_BTN_BG}
        >
          {submit.isPending ? "Submitting…" : "Save & resubmit"}
        </button>
      </div>
    </>
  );
}

interface EditFormState {
  make: string;
  model: string;
  year: string;
  colour: string;
  reg: string;
  mileage: string;
  condition: string;
  faults: string;
  type: string;
  brand: string;
  batteryHealthPercent: number;
  specs: string;
  usage: string;
  defects: string;
  proofDocumentUrl: string;
  basePriceNaira: number;
  holdPercent: number;
  minimumBidIncrementNaira: number;
  startTime: string;
  durationMinutes: number;
}

function toFormState(l: CarListing | GadgetListing): EditFormState {
  const base = {
    basePriceNaira: l.basePrice,
    holdPercent: l.holdPercent,
    minimumBidIncrementNaira: l.minimumBidIncrement,
    startTime: toLocalInput(l.startTime),
    durationMinutes: l.durationMinutes,
  };
  if (l.category === "cars") {
    return {
      make: l.make,
      model: l.model,
      year: String(l.year),
      colour: l.colour,
      reg: l.registrationNumber,
      mileage: String(l.mileage),
      condition: l.condition,
      faults: l.knownFaults ?? "",
      type: "",
      brand: "",
      batteryHealthPercent: 0,
      specs: "",
      usage: "",
      defects: "",
      proofDocumentUrl: "",
      ...base,
    };
  }
  return {
    make: "",
    model: l.model,
    year: "",
    colour: l.colour,
    reg: "",
    mileage: "",
    condition: "",
    faults: "",
    type: l.type,
    brand: l.brand,
    batteryHealthPercent: l.batteryHealthPercent ?? 0,
    specs: l.specs
      ? Object.entries(l.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "",
    usage: l.usageHistory,
    defects: l.defects ?? "",
    proofDocumentUrl: l.proofDocumentUrl,
    ...base,
  };
}

function toLocalInput(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function parseSpecs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of s.split(",")) {
    const [k, v] = pair.split(":").map((x) => x.trim());
    if (k && v) out[k] = v;
  }
  return out;
}

interface FG<T> {
  form: EditFormState;
  set: <K extends keyof T>(k: K, v: T[K]) => void;
}

function CarFields({ form, set }: FG<EditFormState>) {
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

function GadgetFields({ form, set }: FG<EditFormState>) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Text label="Type" value={form.type} onChange={(v) => set("type", v)} />
      <Text label="Brand" value={form.brand} onChange={(v) => set("brand", v)} />
      <Text label="Model" value={form.model} onChange={(v) => set("model", v)} />
      <Text label="Colour" value={form.colour} onChange={(v) => set("colour", v)} />
      <Num
        label="Battery health (%)"
        value={form.batteryHealthPercent}
        onChange={(v) => set("batteryHealthPercent", v)}
      />
      <Text
        label="Specs (key:value, key:value)"
        value={form.specs}
        onChange={(v) => set("specs", v)}
      />
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

function PricingFields({ form, set }: FG<EditFormState>) {
  return (
    <div className="mt-6">
      <h2 className="text-[15px] font-semibold tracking-tight">Pricing</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Num
          label="Base price (₦)"
          value={form.basePriceNaira}
          onChange={(v) => set("basePriceNaira", v)}
        />
        <Num
          label="Bid hold (%)"
          value={form.holdPercent}
          onChange={(v) => set("holdPercent", v)}
        />
        <Num
          label="Minimum bid increment (₦)"
          value={form.minimumBidIncrementNaira}
          onChange={(v) => set("minimumBidIncrementNaira", v)}
        />
        <Num
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

function Num({
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
