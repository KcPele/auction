import {
  AbilityBuilder,
  createMongoAbility,
  type ForcedSubject,
  type MongoAbility,
} from "@casl/ability";

// Action verbs we use across the app.
export type Actions =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "settle"
  | "authorize";

// Domain subjects we gate.
type SubjectName =
  | "Auction"
  | "Listing"
  | "ListingApplication"
  | "AccessCode"
  | "ListingPermission"
  | "Wallet"
  | "Withdrawal"
  | "Settlement"
  | "User"
  | "Mechanic"
  | "Settings"
  | "Health"
  | "all";

export type Subjects =
  | SubjectName
  | (ForcedSubject<"Listing"> & { category: string });

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Build a CASL ability for the current user role.
 * Backend role values come from `UserRole` enum (`ADMIN`, `INDIVIDUAL_BIDDER`,
 * `CAR_DEALER`, `MECHANIC`).
 */
export function buildAbilityFor(
  role: string | undefined | null,
  listingCategories: string[] = [],
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === "ADMIN") {
    can("manage", "all");
    return build();
  }

  // Defaults for any signed-in non-admin user.
  can("read", "Auction");
  can("create", "Wallet");
  can("create", "Withdrawal");
  if (listingCategories.length)
    can("create", "Listing", { category: { $in: listingCategories } });
  return build();
}
