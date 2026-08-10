import { fmtNaira } from "../utils";
import { Stat } from "./FormPrimitives";

export function PreviewStep({
  title,
  summary,
  basePrice,
  holdPercent,
  bidIncrement,
  duration,
  photoCount,
  isCreating,
  onBack,
  onCreate,
}: {
  title: string;
  summary: string;
  basePrice: number;
  holdPercent: number;
  bidIncrement: number;
  duration: number;
  photoCount: number;
  isCreating: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="text-sm text-fg-muted">Review & submit</div>
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="mt-1 text-xs text-fg-dim">{summary}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Base price" value={fmtNaira(basePrice)} />
          <Stat label="Hold" value={`${holdPercent}%`} />
          <Stat label="Min increment" value={fmtNaira(bidIncrement)} />
          <Stat label="Duration" value={`${duration} min`} />
        </div>
        <div className="mt-2 text-[11px] text-fg-dim">Photos: {photoCount}</div>
      </div>
      <div className="rounded-lg border border-line bg-surface p-3 text-xs text-fg-muted">
        Saved as draft. Submit it for admin review from My listings.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-muted"
        >
          Back
        </button>
        <button
          type="button"
          disabled={isCreating}
          onClick={onCreate}
          className="flex-1 cursor-pointer rounded-xl border-none bg-primary p-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isCreating ? "Creating…" : "Create draft"}
        </button>
      </div>
    </div>
  );
}
