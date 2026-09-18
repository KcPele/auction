import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const carTitle = `2020 QA-${runId} Corolla`;
const carAuctionId = "218fdd9e-ecea-4775-8468-7d1979ac8766";

test("completed car delivery and resolved dispute remain consistent", async ({
  browser,
}) => {
  const evidence = new BetaEvidence(`${runId}-car-lifecycle`);

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  evidence.observe(userPage);
  await signInBetaIdentity(userPage, identities.bidderB);
  await userPage.goto(`/dashboard/auction/${carAuctionId}`);
  await expect(userPage.getByRole("heading", { name: carTitle })).toBeVisible();
  await expect(userPage.getByText("settled", { exact: true })).toBeVisible();
  await userPage.goto(`/dashboard/auction/${carAuctionId}/delivery`);
  await expect(userPage.getByText(/^Delivered/)).toBeVisible();
  await expect(userPage.getByRole("heading", { name: "Delivery issue" })).toBeVisible();
  await expect(userPage.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(userPage.getByRole("button", { name: "Report issue" })).toHaveCount(0);
  await userContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  evidence.observe(adminPage);
  await signInBetaIdentity(adminPage, identities.admin);
  await adminPage.goto("/admin/disputes");
  const dispute = adminPage
    .getByText("QA verification: delivered item condition requires administrator review.", {
      exact: true,
    })
    .locator("xpath=ancestor::*[self::li or @role='listitem'][1]");
  await expect(dispute.getByText("RESOLVED", { exact: true })).toBeVisible();
  await expect(
    dispute.getByText(
      "Resolution: QA review completed; delivery evidence recorded and both parties notified.",
      { exact: true },
    ),
  ).toBeVisible();
  await evidence.record({
    step: "car-settled-delivered-and-dispute-resolved",
    status: "passed",
    path: adminPage.url(),
  });
  await evidence.flush();
  await adminContext.close();
});
