import type { VerifiedMechanic } from "@/app/components/listings/types/listing.types";
import { inputClass, labelClass } from "./constants";

export function MechanicSelect({
  value,
  onChange,
  mechanics,
  isLoading,
  isError,
}: {
  value: string;
  onChange: (value: string) => void;
  mechanics: VerifiedMechanic[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor="verified-mechanic">
        Verified mechanic
      </label>
      <select
        id="verified-mechanic"
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || isError || mechanics.length === 0}
      >
        <option value="">
          {isLoading
            ? "Loading mechanics…"
            : isError
              ? "Could not load mechanics"
              : mechanics.length === 0
                ? "No verified mechanics available"
                : "Choose a mechanic"}
        </option>
        {mechanics.map((mechanic) => (
          <option key={mechanic.id} value={mechanic.id}>
            {mechanic.name}
            {mechanic.shopName ? ` · ${mechanic.shopName}` : ""}
            {mechanic.city ? ` · ${mechanic.city}` : ""}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-fg-dim">
        Only mechanics verified by BidNaija can be attached to a car listing.
      </p>
    </div>
  );
}
