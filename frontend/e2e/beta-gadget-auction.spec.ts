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
const listingTag = process.env.E2E_GADGET_TAG ?? runId;
const title = `QA-${listingTag} Apple iPhone 14 Pro`;
const durationMinutes = process.env.E2E_GADGET_DURATION ?? "120";
const startDelayMinutes = Number(process.env.E2E_GADGET_START_DELAY ?? "2");
const gadgetPhoto = path.resolve(process.cwd(), "e2e/fixtures/beta-gadget.jpg");

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

async function createAndSubmitGadget(page: Page) {
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
  await page.getByRole("button", { name: "Gadget", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Type", { exact: true }).fill("Phone");
  await page.getByLabel("Brand", { exact: true }).fill(`QA-${listingTag} Apple`);
  await page.getByLabel("Model", { exact: true }).fill("iPhone 14 Pro");
  await page.getByLabel("Colour", { exact: true }).fill("Space Black");
  await page.getByLabel("Battery health %").fill("91");
  await page.getByLabel("Specs (key:value, key:value)").fill("storage:256GB, ram:6GB");
  await page.getByLabel("Usage history").fill("Single owner, used for one year");
  await page.getByLabel("Defects").fill("Minor edge wear");

  await page
    .locator('input[type="file"][accept="application/pdf,image/*"]')
    .setInputFiles(gadgetPhoto);
  await expect(page.getByText("Proof uploaded")).toBeVisible({ timeout: 60_000 });
  await page
    .locator('input[type="file"][accept="image/*"]')
    .setInputFiles(gadgetPhoto);
  await expect(page.getByText("Uploaded 1 photo(s)")).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Base price (₦)").fill("300000");
  await page.getByLabel("Hold % (10-20)").fill("10");
  await page.getByLabel("Bid increment (₦)").fill("20000");
  await page.getByLabel("Start time").fill(futureLocalDateTime(startDelayMinutes));
  await page.getByLabel("Duration (minutes)").fill(durationMinutes);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create draft" }).click();

  await expect(page).toHaveURL(/\/dashboard\/listings$/, { timeout: 20_000 });
  await expect(page.getByText(title, { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  const card = page
    .getByText(title, { exact: true })
    .locator("xpath=ancestor::div[.//a[normalize-space()='View']][1]");
  await card.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Submitted for review")).toBeVisible();
}

test("creates, approves, and starts a real gadget auction through the UI", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const evidence = new BetaEvidence(`${runId}-gadget-auction`);

  const seller = await authenticatedPage(browser, identities.gadgetSeller);
  evidence.observe(seller.page);
  await createAndSubmitGadget(seller.page);
  await seller.context.close();

  const admin = await authenticatedPage(browser, identities.admin);
  evidence.observe(admin.page);
  await admin.page.goto("/admin/listings");
  await expect(admin.page.getByText("Loading…", { exact: true })).toHaveCount(0);
  const queuedTitle = admin.page.getByText(title, { exact: true });
  if (await queuedTitle.count()) {
    const queued = queuedTitle.locator(
      "xpath=ancestor::div[.//button[normalize-space()='Approve']][1]",
    );
    await queued.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(admin.page.getByText("Listing approved")).toBeVisible();
  }

  await admin.page.goto("/admin/auctions");
  await expect
    .poll(
      async () => {
        await admin.page.reload();
        await admin.page
          .getByText("Loading…", { exact: true })
          .waitFor({ state: "hidden", timeout: 10_000 });
        const liveRow = admin.page.getByRole("row").filter({ hasText: title });
        return (await liveRow.count()) ? await liveRow.first().innerText() : "";
      },
      { timeout: 150_000, intervals: [2_000, 5_000] },
    )
    .toContain("LIVE");
  await evidence.record({
    step: "gadget-listing-created-approved-live",
    status: "passed",
    path: admin.page.url(),
  });
  await evidence.flush();
  await admin.context.close();
});
