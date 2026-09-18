import { expect, test, type Browser } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import {
  createBetaIdentities,
  type BetaIdentity,
} from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);

async function fundThroughUi(browser: Browser, identity: BetaIdentity) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInBetaIdentity(page, identity);
  await page.goto("/dashboard/wallet");
  const walletHero = page.getByText("Wallet balance").locator("..");
  await expect(walletHero).toBeVisible();

  const priorFunding = page.getByText("+₦1,000,000").first();
  if (!(await priorFunding.count())) {
    await page.goto("/dashboard/wallet/topup");
    await page.getByRole("button", { name: "1M", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Funding account ready")).toBeVisible();
    await page
      .getByRole("button", { name: /Simulate ₦1,000,000 payment/ })
      .click();
    await expect(
      page.getByText("Wallet credited ₦1,000,000 (sandbox)"),
    ).toBeVisible();
  }

  await page.goto("/dashboard/wallet");
  await expect(page.getByText("Wallet top-up").first()).toBeVisible();
  await expect(page.getByText("+₦1,000,000").first()).toBeVisible();
  await page.goto("/dashboard/notifications");
  await expect(page.getByText("Wallet funded").first()).toBeVisible();
  await context.close();
}

test("funds both bidders and persists the 10% bid requirement", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const evidence = new BetaEvidence(`${runId}-wallet`);

  await fundThroughUi(browser, identities.bidderA);
  await fundThroughUi(browser, identities.bidderB);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  evidence.observe(adminPage);
  await signInBetaIdentity(adminPage, identities.admin);
  await adminPage.goto("/admin/settings");
  const bidRequirement = adminPage.getByLabel("Bid requirement");
  await expect(bidRequirement).toBeVisible();
  await bidRequirement.fill("10");
  await adminPage
    .getByText("Bidding", { exact: true })
    .locator("..")
    .getByRole("button", { name: "Save" })
    .click();
  await expect(adminPage.getByText("Bidding updated")).toBeVisible();
  await adminPage.reload();
  await expect(adminPage.getByLabel("Bid requirement")).toHaveValue("10");
  await evidence.record({
    step: "wallet-funding-and-bid-requirement",
    status: "passed",
    path: adminPage.url(),
  });
  await evidence.flush();
  await adminContext.close();
});
