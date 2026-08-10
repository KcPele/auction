import { Icon } from "../primitives/Icon";
import type { ListingCategory } from "./types";

export function CategoryStep({
  category,
  onSelect,
  onContinue,
}: {
  category: ListingCategory | null;
  onSelect: (category: ListingCategory) => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-4 text-sm text-fg-muted">What are you listing?</div>
      <div className="grid grid-cols-2 gap-3">
        {(["CAR", "GADGET"] as ListingCategory[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`flex flex-col items-center gap-3 rounded-[14px] border p-6 text-left transition-colors ${
              category === item
                ? "border-accent bg-accent/[0.08]"
                : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <Icon
              name={item === "CAR" ? "car" : "phone"}
              size={32}
              className={category === item ? "text-accent" : "text-fg-muted"}
            />
            <div className="text-sm font-semibold">
              {item === "CAR" ? "Car" : "Gadget"}
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!category}
        onClick={onContinue}
        className="mt-6 w-full cursor-pointer rounded-xl border-none bg-primary p-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
