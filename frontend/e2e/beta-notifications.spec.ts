import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);

test("notification history, read actions, and auction deep links work", async ({
  page,
}) => {
  const evidence = new BetaEvidence(`${runId}-notifications`);
  evidence.observe(page);
  await signInBetaIdentity(page, identities.bidderB);
  await page.goto("/dashboard/notifications");

  for (const title of [
    "Wallet funded",
    "You won an auction",
    "Payment confirmed",
    "Delivery update",
    "Dispute resolved",
    "BidNaija Support replied",
  ]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await page.getByRole("button", { name: /^You won an auction/ }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/auction\/[a-f0-9-]+$/);
  await expect(page.getByRole("main")).toBeVisible();

  await page.goto("/dashboard/notifications");
  const markAllRead = page.getByRole("button", { name: "Mark all read" });
  if (await markAllRead.count()) {
    await markAllRead.click();
    await expect(markAllRead).toHaveCount(0);
  }

  await evidence.record({
    step: "notification-history-read-actions-and-deep-link",
    status: "passed",
    path: page.url(),
  });
  await evidence.flush();
});
