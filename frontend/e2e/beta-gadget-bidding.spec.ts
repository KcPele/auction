import { expect, test, type Browser, type Page } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import {
  createBetaIdentities,
  type BetaIdentity,
} from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const listingTag = process.env.E2E_GADGET_TAG ?? runId;
const title = `QA-${listingTag} Apple iPhone 14 Pro`;

async function authenticatedPage(browser: Browser, identity: BetaIdentity) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInBetaIdentity(page, identity);
  return { context, page };
}

async function openGadgetAuction(page: Page) {
  await page.goto("/dashboard/browse");
  await page.getByText(title, { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Live", { exact: true }).first()).toBeVisible();
}

async function placeBid(page: Page, amount: string, successText: string) {
  await page.getByLabel("Bid amount").fill(amount);
  await page.getByRole("button", { name: "Place bid" }).click();
  await expect(page.getByText(successText, { exact: true })).toBeVisible();
}

test("keeps the gadget auction live after competing bids", async ({ browser }) => {
  test.setTimeout(120_000);
  const evidence = new BetaEvidence(`${runId}-gadget-bidding`);

  const bidderA = await authenticatedPage(browser, identities.bidderA);
  evidence.observe(bidderA.page);
  await openGadgetAuction(bidderA.page);
  const bidderACount = bidderA.page.getByText(/\d+ bids placed/);
  if ((await bidderACount.innerText()).startsWith("0 ")) {
    await placeBid(bidderA.page, "350000", "Bid placed at ₦350,000");
  }
  await bidderA.context.close();

  const bidderB = await authenticatedPage(browser, identities.bidderB);
  evidence.observe(bidderB.page);
  await openGadgetAuction(bidderB.page);
  const bidderBCount = bidderB.page.getByText(/\d+ bids placed/);
  if ((await bidderBCount.innerText()).startsWith("1 ")) {
    await placeBid(bidderB.page, "380000", "Bid placed at ₦380,000");
  }
  await expect(bidderB.page.getByText("2 bids placed", { exact: true })).toBeVisible();
  await expect(bidderB.page.getByText("₦380,000", { exact: true }).first()).toBeVisible();
  await expect(bidderB.page.getByText("Live", { exact: true }).first()).toBeVisible();
  await bidderB.context.close();

  const bidderAAfter = await authenticatedPage(browser, identities.bidderA);
  evidence.observe(bidderAAfter.page);
  await bidderAAfter.page.goto("/dashboard/notifications");
  await expect(bidderAAfter.page.getByText("You have been outbid").first()).toBeVisible();
  await bidderAAfter.page.goto("/dashboard/wallet");
  await expect(bidderAAfter.page.getByText("Bid hold released").first()).toBeVisible();
  await evidence.record({
    step: "gadget-competing-bids-hold-release-and-live-status",
    status: "passed",
    path: bidderAAfter.page.url(),
  });
  await evidence.flush();
  await bidderAAfter.context.close();
});
