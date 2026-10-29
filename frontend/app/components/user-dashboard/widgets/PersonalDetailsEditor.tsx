"use client";

export interface PersonalDetailsValues {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PersonalDetailsEditorProps {
  values: PersonalDetailsValues;
  onChange: (field: keyof PersonalDetailsValues, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const FIELDS: {
  key: keyof PersonalDetailsValues;
  label: string;
  autoComplete: string;
  type: string;
  placeholder?: string;
  inputMode?: "tel";
}[] = [
  { key: "firstName", label: "First name", autoComplete: "given-name", type: "text", placeholder: "John" },
  { key: "lastName", label: "Last name", autoComplete: "family-name", type: "text", placeholder: "Doe" },
  { key: "phone", label: "Phone", autoComplete: "tel", type: "tel", inputMode: "tel" },
];

/**
 * Expands in place under the Personal details row, so the form appears where
 * the row was tapped instead of somewhere else on the page.
 */
export function PersonalDetailsEditor({
  values,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: PersonalDetailsEditorProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-surface-subtle px-4 py-4 last:border-b-0">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label
            htmlFor={`profile-${field.key}`}
            className="mb-1 block text-xs font-medium text-fg-muted"
          >
            {field.label}
          </label>
          <input
            id={`profile-${field.key}`}
            autoComplete={field.autoComplete}
            inputMode={field.inputMode}
            type={field.type}
            placeholder={field.placeholder}
            value={values[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="w-full rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
          />
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={onSave}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
