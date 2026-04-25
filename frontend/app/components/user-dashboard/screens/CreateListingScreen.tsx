"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../primitives/Icon";
import { fmtNaira } from "../utils";

type Step = "category" | "details" | "pricing" | "preview";
type ListingCategory = "CAR" | "GADGET";

const PRIMARY_BTN_BG = {
  background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
};

export function CreateListingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<ListingCategory | null>(null);

  // Car fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [colour, setColour] = useState("");
  const [reg, setReg] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [faults, setFaults] = useState("");

  // Gadget fields
  const [gadgetType, setGadgetType] = useState("");
  const [brand, setBrand] = useState("");
  const [gadgetModel, setGadgetModel] = useState("");
  const [gadgetColour, setGadgetColour] = useState("");
  const [battery, setBattery] = useState("");
  const [specs, setSpecs] = useState("");
  const [usage, setUsage] = useState("");
  const [defects, setDefects] = useState("");

  // Pricing
  const [basePrice, setBasePrice] = useState(0);
  const [holdPercent, setHoldPercent] = useState(10);
  const [bidIncrement, setBidIncrement] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(120);

  const inputClass = "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim";
  const labelClass = "mb-1 block text-xs font-medium text-fg-muted";

  return (
    <>
      <h1 className="m-0 font-display text-[26px] font-semibold tracking-tight">Create listing</h1>

      {/* Step indicator */}
      <div className="mt-3 flex gap-2">
        {(["category", "details", "pricing", "preview"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s === step ? "bg-accent" : i < ["category", "details", "pricing", "preview"].indexOf(step) ? "bg-accent/40" : "bg-surface-2"
            }`}
          />
        ))}
      </div>

      {step === "category" && (
        <div className="mt-6">
          <div className="mb-4 text-sm text-fg-muted">What are you listing?</div>
          <div className="grid grid-cols-2 gap-3">
            {(["CAR", "GADGET"] as ListingCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-3 rounded-[14px] border p-6 text-left transition-colors ${
                  category === cat
                    ? "border-accent bg-accent/[0.08]"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <Icon name={cat === "CAR" ? "car" : "phone"} size={32} className={category === cat ? "text-accent" : "text-fg-muted"} />
                <div className="text-sm font-semibold">{cat === "CAR" ? "Car" : "Gadget"}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!category}
            onClick={() => setStep("details")}
            className="mt-6 w-full cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00] disabled:opacity-40"
            style={PRIMARY_BTN_BG}
          >
            Continue <Icon name="arrow-r" size={14} />
          </button>
        </div>
      )}

      {step === "details" && category === "CAR" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Car details</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Make</label><input className={inputClass} placeholder="Toyota" value={make} onChange={(e) => setMake(e.target.value)} /></div>
            <div><label className={labelClass}>Model</label><input className={inputClass} placeholder="Camry" value={model} onChange={(e) => setModel(e.target.value)} /></div>
            <div><label className={labelClass}>Year</label><input className={inputClass} type="number" placeholder="2018" value={year} onChange={(e) => setYear(e.target.value)} /></div>
            <div><label className={labelClass}>Colour</label><input className={inputClass} placeholder="Black" value={colour} onChange={(e) => setColour(e.target.value)} /></div>
            <div><label className={labelClass}>Registration</label><input className={inputClass} placeholder="ABC-123-LA" value={reg} onChange={(e) => setReg(e.target.value)} /></div>
            <div><label className={labelClass}>Mileage (km)</label><input className={inputClass} type="number" placeholder="68000" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>Condition</label><input className={inputClass} placeholder="Good" value={condition} onChange={(e) => setCondition(e.target.value)} /></div>
          <div><label className={labelClass}>Known faults</label><input className={inputClass} placeholder="AC needs servicing" value={faults} onChange={(e) => setFaults(e.target.value)} /></div>
          <div><label className={labelClass}>Photos</label><div className={inputClass + " cursor-pointer text-fg-dim"}><Icon name="image" size={14} /> Upload photos</div></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("category")} className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted">Back</button>
            <button type="button" onClick={() => setStep("pricing")} className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00]" style={PRIMARY_BTN_BG}>Continue</button>
          </div>
        </div>
      )}

      {step === "details" && category === "GADGET" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Gadget details</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Type</label><input className={inputClass} placeholder="Phone" value={gadgetType} onChange={(e) => setGadgetType(e.target.value)} /></div>
            <div><label className={labelClass}>Brand</label><input className={inputClass} placeholder="Apple" value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div><label className={labelClass}>Model</label><input className={inputClass} placeholder="iPhone 14 Pro" value={gadgetModel} onChange={(e) => setGadgetModel(e.target.value)} /></div>
            <div><label className={labelClass}>Colour</label><input className={inputClass} placeholder="Space Black" value={gadgetColour} onChange={(e) => setGadgetColour(e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>Battery health %</label><input className={inputClass} type="number" placeholder="88" value={battery} onChange={(e) => setBattery(e.target.value)} /></div>
          <div><label className={labelClass}>Specs</label><input className={inputClass} placeholder="6GB RAM, 256GB storage" value={specs} onChange={(e) => setSpecs(e.target.value)} /></div>
          <div><label className={labelClass}>Usage history</label><input className={inputClass} placeholder="Used for one year" value={usage} onChange={(e) => setUsage(e.target.value)} /></div>
          <div><label className={labelClass}>Defects</label><input className={inputClass} placeholder="Small scratch on the side" value={defects} onChange={(e) => setDefects(e.target.value)} /></div>
          <div><label className={labelClass}>Proof document</label><div className={inputClass + " cursor-pointer text-fg-dim"}><Icon name="shield" size={14} /> Upload receipt</div></div>
          <div><label className={labelClass}>Photos</label><div className={inputClass + " cursor-pointer text-fg-dim"}><Icon name="image" size={14} /> Upload photos</div></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("category")} className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted">Back</button>
            <button type="button" onClick={() => setStep("pricing")} className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00]" style={PRIMARY_BTN_BG}>Continue</button>
          </div>
        </div>
      )}

      {step === "pricing" && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-sm text-fg-muted">Pricing & auction settings</div>
          <div><label className={labelClass}>Base price (₦)</label><input className={inputClass} type="number" placeholder="2500000" value={basePrice || ""} onChange={(e) => setBasePrice(Number(e.target.value))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Hold %</label><input className={inputClass} type="number" min={10} max={20} value={holdPercent} onChange={(e) => setHoldPercent(Number(e.target.value))} /></div>
            <div><label className={labelClass}>Bid increment (₦)</label><input className={inputClass} type="number" placeholder="50000" value={bidIncrement || ""} onChange={(e) => setBidIncrement(Number(e.target.value))} /></div>
          </div>
          <div><label className={labelClass}>Start time</label><input className={inputClass} type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
          <div><label className={labelClass}>Duration (minutes)</label><input className={inputClass} type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
          {basePrice > 0 && (
            <div className="rounded-lg border border-accent/20 bg-accent/[0.04] p-3 text-xs text-fg-muted">
              Hold amount per bid: <strong className="text-accent">{fmtNaira(basePrice * holdPercent / 100)}</strong> ({holdPercent}% of base price)
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("details")} className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted">Back</button>
            <button type="button" onClick={() => setStep("preview")} className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00]" style={PRIMARY_BTN_BG}>Preview</button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="text-sm text-fg-muted">Review & submit</div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <div className="text-[15px] font-semibold">
              {category === "CAR" ? `${year} ${make} ${model}` : `${brand} ${gadgetModel}`}
            </div>
            <div className="mt-1 text-xs text-fg-dim">{category === "CAR" ? `${colour} · ${mileage} km` : `${gadgetColour} · ${battery}% battery`}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-line p-2"><div className="text-fg-dim">Base price</div><div className="font-semibold">{fmtNaira(basePrice)}</div></div>
              <div className="rounded-lg border border-line p-2"><div className="text-fg-dim">Hold</div><div className="font-semibold">{holdPercent}%</div></div>
              <div className="rounded-lg border border-line p-2"><div className="text-fg-dim">Min increment</div><div className="font-semibold">{fmtNaira(bidIncrement)}</div></div>
              <div className="rounded-lg border border-line p-2"><div className="text-fg-dim">Duration</div><div className="font-semibold">{duration} min</div></div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3 text-xs text-fg-muted">
            Your listing will be saved as a draft. Submit it for admin review to go live.
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("pricing")} className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted">Back</button>
            <button
              type="button"
              onClick={() => {
                // Integration: POST /api/v1/cars or POST /api/v1/gadgets, then POST /api/v1/cars/{id}/submit
                alert("Listing created as draft. Submit for review when ready.");
                router.push("/dashboard/listings");
              }}
              className="flex-1 cursor-pointer rounded-xl border-none p-3.5 text-sm font-bold text-[#1a0a00]"
              style={PRIMARY_BTN_BG}
            >
              Create draft
            </button>
          </div>
        </div>
      )}
    </>
  );
}
