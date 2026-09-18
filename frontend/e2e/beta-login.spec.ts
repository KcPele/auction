import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);

test("all beta roles can sign in and reach the correct application", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const evidence = new BetaEvidence(`${runId}-login`);

  for (const identity of Object.values(identities)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    evidence.observe(page);

    await signInBetaIdentity(page, identity);
    await expect(page.getByRole("main")).toBeVisible();
    await evidence.record({
      step: `login:${identity.label}`,
      status: "passed",
      path: page.url(),
    });
    await context.close();
  }

  await evidence.flush();
});

test("a beta user can sign in with their phone number", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use phone number" }).click();
  await page.getByLabel("Phone number").fill(identities.bidderA.phone);
  await page
    .getByLabel("Password", { exact: true })
    .fill(identities.bidderA.password);
  await page.getByRole("button", { name: /^Sign in/ }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test("a non-admin cannot open the admin application", async ({ page }) => {
  await signInBetaIdentity(page, identities.bidderB);
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});
