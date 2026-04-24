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
    <div className="dash-chips">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`dash-chip ${value === o.id ? "active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
