export type ListingCategory = "CAR" | "GADGET";

export type ListingCapabilities = {
  hasCar: boolean;
  hasGadget: boolean;
  hasAny: boolean;
  hasAll: boolean;
  grantedCategories: ListingCategory[];
  missingCategories: ListingCategory[];
};

const CATEGORIES: ListingCategory[] = ["CAR", "GADGET"];

export function deriveListingCapabilities(
  permissions: ReadonlyArray<{ category: ListingCategory }> = [],
): ListingCapabilities {
  const granted = new Set(permissions.map((permission) => permission.category));
  const grantedCategories = CATEGORIES.filter((category) => granted.has(category));
  const missingCategories = CATEGORIES.filter((category) => !granted.has(category));

  return {
    hasCar: granted.has("CAR"),
    hasGadget: granted.has("GADGET"),
    hasAny: grantedCategories.length > 0,
    hasAll: missingCategories.length === 0,
    grantedCategories,
    missingCategories,
  };
}
