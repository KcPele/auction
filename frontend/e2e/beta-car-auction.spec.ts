import path from "node:path";
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
const carPhoto = path.resolve(process.cwd(), "e2e/fixtures/beta-car.jpg");

async function authenticatedPage(browser: Browser, identity: BetaIdentity) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInBetaIdentity(page, identity);
  return { context, page };
}

function futureLocalDateTime(minutesFromNow: number) {
  const date = new Date(Date.now() + minutesFromNow * 60_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

async function createAndSubmitCar(page: Page) {
  await page.goto("/dashboard/listings");
  await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
  const existingTitle = page.getByText(title, { exact: true });
  if (await existingTitle.count()) {
    const existingCard = existingTitle.locator(
      "xpath=ancestor::div[.//a[normalize-space()='View']][1]",
    );
    const submitButton = existingCard.getByRole("button", {
      name: "Submit for review",
    });
    if (await submitButton.count()) {
      await submitButton.click();
      await expect(page.getByText("Submitted for review")).toBeVisible();
    }
    return;
  }

  await page.getByRole("link", { name: /New listing/ }).click();
  await page.getByRole("button", { name: "Car", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Make", { exact: true }).fill(`QA-${runId}`);
  await page.getByLabel("Model", { exact: true }).fill("Corolla");
  await page.getByLabel("Year", { exact: true }).fill("2020");
  await page.getByLabel("Colour", { exact: true }).fill("Silver");
  await page.getByLabel("Registration", { exact: true }).fill("QA-917-LA");
  await page.getByLabel("Mileage (km)", { exact: true }).fill("68000");
  await page.getByLabel("Condition", { exact: true }).fill("Clean and roadworthy");
  await page.getByLabel("Known faults", { exact: true }).fill("None known");
  await page
    .getByLabel("Verified mechanic")
    .selectOption({ label: "Musa Mechanic" });
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles(carPhoto);
  await expect(page.getByText("Uploaded 1 photo(s)")).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Base price (₦)").fill("400000");
  await page.getByLabel("Hold % (10-20)").fill("10");
  await page.getByLabel("Bid increment (₦)").fill("25000");
  await page.getByLabel("Start time").fill(futureLocalDateTime(3));
  await page.getByLabel("Duration (minutes)").fill("120");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/dashboard\/listings$/);
  const card = page.locator("div").filter({ hasText: title }).filter({
    has: page.getByRole("button", { name: "Submit for review" }),
  });
  await card.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Submitted for review")).toBeVisible();
}

test("creates, submits, and approves a real car auction through the UI", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const evidence = new BetaEvidence(`${runId}-car-auction`);

  const seller = await authenticatedPage(browser, identities.carDealer);
  evidence.observe(seller.page);
  await createAndSubmitCar(seller.page);
  await seller.context.close();

  const admin = await authenticatedPage(browser, identities.admin);
  evidence.observe(admin.page);
  await admin.page.goto("/admin/listings");
  const queued = admin.page.locator("div").filter({ hasText: title }).filter({
    has: admin.page.getByRole("button", { name: "Approve", exact: true }),
  });
  if (await queued.count()) {
    await queued.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(admin.page.getByText("Listing approved")).toBeVisible();
  }

  await admin.page.goto("/admin/auctions");
  await admin.page.getByRole("button", { name: "All", exact: true }).click();
  await expect(admin.page.getByRole("row").filter({ hasText: title })).toBeVisible();
  await evidence.record({
    step: "car-listing-created-submitted-approved",
    status: "passed",
    path: admin.page.url(),
  });
  await evidence.flush();
  await admin.context.close();
});
