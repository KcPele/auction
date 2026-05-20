import {
  AbilityBuilder,
  createMongoAbility,
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
export type Subjects =
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

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Build a CASL ability for the current user role.
 * Backend role values come from `UserRole` enum (`ADMIN`, `INDIVIDUAL_BIDDER`,
 * `CAR_DEALER`, `MECHANIC`).
 */
export function buildAbilityFor(role: string | undefined | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === "ADMIN") {
    can("manage", "all");
    return build();
  }

  // Defaults for any signed-in non-admin user.
  can("read", "Auction");
  can("create", "Wallet");
  can("create", "Withdrawal");
  return build();
}
