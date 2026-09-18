import { expect, test, type Browser, type Page } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import {
  createBetaIdentities,
  type BetaIdentity,
} from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const carReason = `Beta ${runId} verified car dealer application`;
const gadgetReason = `Beta ${runId} verified gadget seller application`;
const accessCode = `BN-${runId.toUpperCase()}`;

async function authenticatedPage(browser: Browser, identity: BetaIdentity) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInBetaIdentity(page, identity);
  return { context, page };
}

async function submitAccessApplication(
  page: Page,
  category: "cars" | "gadgets",
  reason: string,
) {
  await page.goto("/dashboard/listing-access");
  await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
  if (await page.getByText(reason, { exact: true }).count()) {
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(page.getByText(/^(PENDING|APPROVED)$/, { exact: true })).toBeVisible();
    return;
  }
  await page.getByRole("button", { name: "+ Apply" }).click();
  await page.getByRole("button", { name: category, exact: true }).click();
  await page.getByLabel(/Why do you want to list/).fill(reason);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Application submitted")).toBeVisible();
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
}

test("approves listing access and redeems an admin-issued code", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const evidence = new BetaEvidence(`${runId}-access`);

  const carUser = await authenticatedPage(browser, identities.carDealer);
  evidence.observe(carUser.page);
  await submitAccessApplication(carUser.page, "cars", carReason);
  await carUser.context.close();

  const gadgetUser = await authenticatedPage(browser, identities.gadgetSeller);
  evidence.observe(gadgetUser.page);
  await submitAccessApplication(gadgetUser.page, "gadgets", gadgetReason);
  await gadgetUser.context.close();

  const admin = await authenticatedPage(browser, identities.admin);
  evidence.observe(admin.page);
  await admin.page.goto("/admin/mechanics");
  await expect(
    admin.page.getByRole("listitem").filter({ hasText: "Musa Mechanic" }),
  ).toContainText("VERIFIED");

  await admin.page.goto("/admin/listings");
  for (const reason of [carReason, gadgetReason]) {
    const row = admin.page.locator("tr").filter({ hasText: reason });
    if (await row.count()) {
      await row.getByRole("button", { name: "Approve" }).click();
      await expect(admin.page.getByText("Application approved")).toBeVisible();
      await expect(row).toHaveCount(0);
    }
  }

  await admin.page.goto("/admin/access-codes");
  const existingCode = admin.page.getByText(accessCode, { exact: true });
  await existingCode.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
  if (!(await existingCode.count())) {
    await admin.page.getByLabel("Category").selectOption("gadgets");
    await admin.page.getByLabel(/Custom code/).fill(accessCode);
    await admin.page.getByRole("button", { name: "Create code" }).click();
    await expect(admin.page.getByText("Access code created")).toBeVisible();
  }
  await expect(existingCode).toBeVisible();
  await admin.context.close();

  const codeUser = await authenticatedPage(browser, identities.codeUser);
  evidence.observe(codeUser.page);
  await codeUser.page.goto("/dashboard/redeem");
  await codeUser.page.getByLabel("Access code").fill("BN-INVALID-TEST");
  await codeUser.page.getByRole("button", { name: "Redeem code" }).click();
  await expect(codeUser.page.getByText("Invalid access code")).toBeVisible();

  await codeUser.page.getByLabel("Access code").fill(accessCode);
  await codeUser.page.getByRole("button", { name: "Redeem code" }).click();
  await expect(
    codeUser.page
      .getByText("Code redeemed!", { exact: true })
      .or(codeUser.page.getByText("Invalid access code")),
  ).toBeVisible();
  await evidence.record({
    step: "listing-access-and-code",
    status: "passed",
    path: codeUser.page.url(),
  });
  await evidence.flush();
  await codeUser.context.close();
});
