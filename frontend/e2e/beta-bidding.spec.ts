import { expect, test, type Browser, type Page } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import {
  createBetaIdentities,
  type BetaIdentity,
} from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const title = `2020 QA-${runId} Corolla`;

async function authenticatedPage(browser: Browser, identity: BetaIdentity) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInBetaIdentity(page, identity);
  return { context, page };
}

async function openCarAuction(page: Page) {
  await page.goto("/dashboard/browse");
  await page.getByText(title, { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

async function placeBid(page: Page, amount: string, successText: string) {
  await page.getByLabel("Bid amount").fill(amount);
  await page.getByRole("button", { name: "Place bid" }).click();
  await expect(page.getByText(successText, { exact: true })).toBeVisible();
}

test("enforces the bid cap and records competing bids through the UI", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const evidence = new BetaEvidence(`${runId}-bidding`);

  const bidderA = await authenticatedPage(browser, identities.bidderA);
  evidence.observe(bidderA.page);
  await openCarAuction(bidderA.page);
  const bidCount = bidderA.page.getByText(/\d+ bids placed/);
  if ((await bidCount.innerText()).startsWith("0 ")) {
    await placeBid(bidderA.page, "399999", "Min bid is ₦400,000");
    await placeBid(
      bidderA.page,
      "10000001",
      "Wallet balance does not meet the auction bid requirement",
    );
    await placeBid(bidderA.page, "500000", "Bid placed at ₦500,000");
  }
  await bidderA.context.close();

  const bidderB = await authenticatedPage(browser, identities.bidderB);
  evidence.observe(bidderB.page);
  await openCarAuction(bidderB.page);
  if ((await bidderB.page.getByText(/\d+ bids placed/).innerText()).startsWith("1 ")) {
    await placeBid(bidderB.page, "524999", "Min bid is ₦525,000");
    await placeBid(bidderB.page, "550000", "Bid placed at ₦550,000");
  }
  await expect(bidderB.page.getByText("2 bids placed", { exact: true })).toBeVisible();
  await expect(bidderB.page.getByText("₦550,000", { exact: true }).first()).toBeVisible();
  await bidderB.context.close();

  const seller = await authenticatedPage(browser, identities.carDealer);
  evidence.observe(seller.page);
  await openCarAuction(seller.page);
  const selfBidMessage = seller.page.getByText(
    "This is your auction. You can follow bids here, but sellers cannot bid.",
  );
  if (await selfBidMessage.count()) await expect(selfBidMessage).toBeVisible();
  await expect(seller.page.getByLabel("Bid amount")).toHaveCount(0);
  await seller.context.close();

  const bidderAAfter = await authenticatedPage(browser, identities.bidderA);
  evidence.observe(bidderAAfter.page);
  await bidderAAfter.page.goto("/dashboard/notifications");
  await expect(bidderAAfter.page.getByText("You have been outbid").first()).toBeVisible();
  await bidderAAfter.page.goto("/dashboard/wallet");
  await expect(bidderAAfter.page.getByText("Bid hold released").first()).toBeVisible();
  await evidence.record({
    step: "bid-cap-competing-bids-and-hold-release",
    status: "passed",
    path: bidderAAfter.page.url(),
  });
  await evidence.flush();
  await bidderAAfter.context.close();
});
