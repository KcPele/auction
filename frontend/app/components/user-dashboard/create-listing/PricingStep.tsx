import { fmtNaira } from "../utils";
import { DateTimeField, Field, NavRow } from "./FormPrimitives";

export function PricingStep({
  basePrice,
  holdPercent,
  bidIncrement,
  startTime,
  duration,
  onBasePriceChange,
  onHoldPercentChange,
  onBidIncrementChange,
  onStartTimeChange,
  onDurationChange,
  onBack,
  onNext,
}: {
  basePrice: number;
  holdPercent: number;
  bidIncrement: number;
  startTime: string;
  duration: number;
  onBasePriceChange: (value: number) => void;
  onHoldPercentChange: (value: number) => void;
  onBidIncrementChange: (value: number) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="text-sm text-fg-muted">Pricing & auction settings</div>
      <Field
        label="Base price (₦)"
        value={basePrice ? String(basePrice) : ""}
        onChange={(value) => onBasePriceChange(Number(value))}
        type="number"
        placeholder="2500000"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Hold % (10-20)"
          value={String(holdPercent)}
          onChange={(value) => onHoldPercentChange(Number(value))}
          type="number"
        />
        <Field
          label="Bid increment (₦)"
          value={bidIncrement ? String(bidIncrement) : ""}
          onChange={(value) => onBidIncrementChange(Number(value))}
          type="number"
          placeholder="50000"
        />
      </div>
      <DateTimeField
        label="Start time"
        value={startTime}
        onChange={onStartTimeChange}
      />
      <Field
        label="Duration (minutes)"
        value={String(duration)}
        onChange={(value) => onDurationChange(Number(value))}
        type="number"
      />
      {basePrice > 0 && (
        <div className="rounded-lg border border-accent/20 bg-accent/[0.04] p-3 text-xs text-fg-muted">
          Hold per bid:{" "}
          <strong className="text-accent">
            {fmtNaira((basePrice * holdPercent) / 100)}
          </strong>
        </div>
      )}
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}
