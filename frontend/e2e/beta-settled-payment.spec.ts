import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const carAuctionId = "218fdd9e-ecea-4775-8468-7d1979ac8766";

test("a settled winner sees payment completion without refetching instructions", async ({
  page,
}) => {
  let instructionRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes(`/auctions/${carAuctionId}/payment-instructions`)) {
      instructionRequests += 1;
    }
  });

  await signInBetaIdentity(page, identities.bidderB);
  await page.goto(`/dashboard/auction/${carAuctionId}/payment`);

  await expect(page.getByRole("heading", { name: "Payment completed" })).toBeVisible();
  await expect(page.getByText("Could not load payment instructions.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Track delivery" })).toHaveAttribute(
    "href",
    `/dashboard/auction/${carAuctionId}/delivery`,
  );
  expect(instructionRequests).toBe(0);
});
