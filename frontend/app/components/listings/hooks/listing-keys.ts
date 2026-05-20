export const listingKeys = {
  all: ["listings"] as const,
  mine: () => [...listingKeys.all, "mine"] as const,
  car: (id: string) => [...listingKeys.all, "car", id] as const,
  gadget: (id: string) => [...listingKeys.all, "gadget", id] as const,
};
