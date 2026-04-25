"use client";

export interface ChipOption<T extends string> {
  id: T;
  label: string;
}

interface ChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Chips<T extends string>({ options, value, onChange }: ChipsProps<T>) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium ${
              active
                ? "border border-line-strong bg-accent/[0.12] text-accent"
                : "border border-line bg-surface text-fg-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
