import { expect, type Page } from "@playwright/test";
import type { BetaIdentity } from "./beta-identities";

export async function registerBetaIdentity(
  page: Page,
  identity: BetaIdentity,
  referralCode?: string,
) {
  await submitBetaRegistration(page, identity, referralCode);

  const outcome = await Promise.race([
    page.waitForURL(/\/otp\?/, { timeout: 20_000 }).then(() => "created" as const),
    page
      .getByText("An account with this email already exists")
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "existing" as const),
  ]);
  if (outcome === "created") {
    await expect(page.getByText(identity.email)).toBeVisible();
  }
}

export async function submitBetaRegistration(
  page: Page,
  identity: BetaIdentity,
  referralCode?: string,
) {
  await page.goto("/register");
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await page.getByLabel("First name").fill(identity.firstName);
  await page.getByLabel("Last name").fill(identity.lastName);
  await page.getByLabel("Email address").fill(identity.email);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 2 of 3")).toBeVisible();
  await page.getByLabel("Phone number").fill(identity.phone);
  await page.getByLabel("Account type").selectOption(identity.appRole);
  if (referralCode) {
    await page.getByLabel("Referral code").fill(referralCode);
  }
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 3 of 3")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(identity.password);
  await page.getByText(/I agree to BidNaija/).click();
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function signInBetaIdentity(page: Page, identity: BetaIdentity) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(identity.email);
  await page.getByLabel("Password", { exact: true }).fill(identity.password);
  await page.getByRole("button", { name: /^Sign in/ }).click();

  const expectedPath = identity.label === "QA Admin" ? /\/admin/ : /\/dashboard/;
  await expect(page).toHaveURL(expectedPath, { timeout: 20_000 });
}
