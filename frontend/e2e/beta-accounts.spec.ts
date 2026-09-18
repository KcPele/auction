import { expect, test } from "@playwright/test";
import {
  registerBetaIdentity,
  submitBetaRegistration,
} from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const referralCode = `BN-${runId.toUpperCase()}`;
const selectedLabel = process.env.E2E_BETA_ONLY;

test.describe("beta account setup", () => {
  test.describe.configure({ mode: "serial" });

  test("creates every beta role through the real signup UI", async ({ page }) => {
    test.setTimeout(180_000);
    const evidence = new BetaEvidence(runId);
    evidence.observe(page);

    const selectedIdentities = Object.values(identities).filter(
      (identity) => !selectedLabel || identity.label === selectedLabel,
    );

    for (const identity of selectedIdentities) {
      await registerBetaIdentity(
        page,
        identity,
        identity === identities.codeUser ? referralCode : undefined,
      );
      await evidence.record({
        step: `register:${identity.label}`,
        status: "passed",
        path: page.url(),
      });
    }

    await evidence.flush();
  });
});

test("shows exact duplicate email and phone errors", async ({ page }) => {
  const duplicateEmail = {
    ...identities.bidderA,
    label: "Duplicate email check",
    phone: "+2348002609188",
  };
  await submitBetaRegistration(page, duplicateEmail);
  await expect(
    page.getByText("An account with this email already exists").first(),
  ).toBeVisible();

  const duplicatePhone = {
    ...identities.bidderA,
    label: "Duplicate phone check",
    email: `beta.duplicate-phone.${runId}@bidnaija.local`,
  };
  await submitBetaRegistration(page, duplicatePhone);
  await expect(
    page.getByText("An account with this phone number already exists").first(),
  ).toBeVisible();
});
