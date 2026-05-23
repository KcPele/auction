"use client";
import { useEffect, useRef } from "react";
import { Icon } from "../primitives/Icon";

export interface BrowseFilters {
  minPrice?: number; // naira
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  value: BrowseFilters;
  onChange: (next: BrowseFilters) => void;
  /** Hide year fields for gadget-only filter sets. */
  showYearFields?: boolean;
}

/**
 * Popover used by BrowseScreen. Pure UI — owner manages state and pushes the
 * filters back into the auctions query.
 */
export function FilterPanel({
  open,
  onClose,
  value,
  onChange,
  showYearFields = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;
  const set = (patch: Partial<BrowseFilters>) => onChange({ ...value, ...patch });
  const num = (s: string) => (s === "" ? undefined : Number(s));

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-20 mt-2 w-[320px] rounded-xl border border-line bg-bg p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-fg">Filters</div>
        <button
          type="button"
          onClick={() => {
            onChange({});
            onClose();
          }}
          className="text-[11px] text-fg-dim hover:text-fg"
        >
          Clear all
        </button>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-fg-dim">
          Price (₦)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={value.minPrice ?? ""}
            onChange={(e) => set({ minPrice: num(e.target.value) })}
            className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
          <span className="text-xs text-fg-dim">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={value.maxPrice ?? ""}
            onChange={(e) => set({ maxPrice: num(e.target.value) })}
            className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
        </div>
      </div>

      {showYearFields && (
        <div className="mb-3">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-fg-dim">
            Year (cars only)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="From"
              value={value.minYear ?? ""}
              onChange={(e) => set({ minYear: num(e.target.value) })}
              className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
            />
            <span className="text-xs text-fg-dim">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="To"
              value={value.maxYear ?? ""}
              onChange={(e) => set({ maxYear: num(e.target.value) })}
              className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-surface py-2 text-xs font-medium text-fg-muted hover:text-fg"
      >
        <Icon name="check" size={12} /> Apply
      </button>
    </div>
  );
}
