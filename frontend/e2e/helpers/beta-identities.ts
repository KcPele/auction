export type BetaIdentity = {
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  appRole: "INDIVIDUAL_BIDDER" | "CAR_DEALER" | "MECHANIC";
};

export type BetaIdentities = {
  admin: BetaIdentity;
  mechanic: BetaIdentity;
  carDealer: BetaIdentity;
  gadgetSeller: BetaIdentity;
  bidderA: BetaIdentity;
  bidderB: BetaIdentity;
  codeUser: BetaIdentity;
};

export function createBetaIdentities(runId: string): BetaIdentities {
  const password = process.env.E2E_BETA_PASSWORD ?? "BidNaija!2026QA";
  const phoneStem = runId.replace(/\D/g, "").slice(-7).padStart(7, "0");
  const make = (
    label: string,
    firstName: string,
    lastName: string,
    suffix: string,
    digit: string,
    appRole: BetaIdentity["appRole"],
  ): BetaIdentity => ({
    label,
    firstName,
    lastName,
    email: `beta.${suffix}.${runId}@bidnaija.local`,
    phone: `+23480${phoneStem}${digit}`,
    password,
    appRole,
  });

  return {
    admin: make("QA Admin", "Beta", "Admin", "admin", "1", "INDIVIDUAL_BIDDER"),
    mechanic: make("QA Mechanic", "Musa", "Mechanic", "mechanic", "2", "MECHANIC"),
    carDealer: make("QA Car Dealer", "Chidi", "Dealer", "car", "3", "CAR_DEALER"),
    gadgetSeller: make(
      "QA Gadget Seller",
      "Tola",
      "Gadget",
      "gadget",
      "4",
      "INDIVIDUAL_BIDDER",
    ),
    bidderA: make("QA Bidder A", "Ada", "Bidder", "biddera", "5", "INDIVIDUAL_BIDDER"),
    bidderB: make("QA Bidder B", "Bola", "Bidder", "bidderb", "6", "INDIVIDUAL_BIDDER"),
    codeUser: make("QA Code User", "Kemi", "Code", "code", "7", "INDIVIDUAL_BIDDER"),
  };
}
