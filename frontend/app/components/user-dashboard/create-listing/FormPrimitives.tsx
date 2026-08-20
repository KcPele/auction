import { inputClass, labelClass } from "./constants";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input
        aria-label={label}
        className={inputClass}
        type="datetime-local"
        value={value}
        onInput={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

export function NavRow({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
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
        onClick={onNext}
        className="flex-1 cursor-pointer rounded-xl border-none bg-primary p-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Continue
      </button>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-2">
      <div className="text-fg-dim">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
