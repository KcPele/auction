import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const userMessage = `QA ${runId}: I need a human agent to review my delivered item.`;
const adminReply = `QA ${runId}: A support agent has reviewed your request.`;

test("hands a support conversation to an admin and returns the reply", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const evidence = new BetaEvidence(`${runId}-support`);
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  evidence.observe(userPage);
  await signInBetaIdentity(userPage, identities.bidderB);
  await userPage.goto("/dashboard/support");
  await expect(userPage).toHaveURL(/\?c=/, { timeout: 20_000 });
  const previousConversationId = new URL(userPage.url()).searchParams.get("c");

  // Always start a fresh AI conversation. Reusing the most recent thread can
  // select a conversation that is already waiting for an agent, which skips
  // the user-visible handoff control this regression is meant to verify.
  await userPage.getByRole("button", { name: "+ New", exact: true }).click();
  await expect
    .poll(() => new URL(userPage.url()).searchParams.get("c"), {
      timeout: 20_000,
    })
    .not.toBe(previousConversationId);
  const conversationId = new URL(userPage.url()).searchParams.get("c");
  expect(conversationId).toBeTruthy();

  const messageBox = userPage.getByPlaceholder(/Type a message/);
  await messageBox.fill(userMessage);
  await userPage.getByRole("button", { name: "Send" }).click();
  await expect(userPage.getByText(userMessage, { exact: true })).toBeVisible();

  const humanButton = userPage.getByRole("button", { name: "Talk to a human" });
  const waitingBadge = userPage
    .locator("header")
    .getByText("WAITING FOR HUMAN", { exact: true });
  await expect(humanButton.or(waitingBadge)).toBeVisible();
  if (await humanButton.isVisible()) await humanButton.click();
  await expect(waitingBadge).toBeVisible();
  await userContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  evidence.observe(adminPage);
  await signInBetaIdentity(adminPage, identities.admin);
  await adminPage.goto(`/admin/support?c=${conversationId}`);
  await expect(adminPage.getByText(userMessage, { exact: true })).toBeVisible();
  await adminPage.getByRole("button", { name: "Take over" }).click();
  if (!(await adminPage.getByText(adminReply, { exact: true }).count())) {
    await adminPage.getByPlaceholder(/Reply as support agent/).fill(adminReply);
    await adminPage.getByRole("button", { name: "Send" }).click();
  }
  await expect(adminPage.getByText(adminReply, { exact: true })).toBeVisible();
  await adminContext.close();

  const verifyContext = await browser.newContext();
  const verifyPage = await verifyContext.newPage();
  evidence.observe(verifyPage);
  await signInBetaIdentity(verifyPage, identities.bidderB);
  await verifyPage.goto(`/dashboard/support?c=${conversationId}`);
  await expect(verifyPage.getByText(adminReply, { exact: true })).toBeVisible();
  await verifyPage.goto("/dashboard/notifications");
  await expect(verifyPage.getByText("BidNaija Support replied").first()).toBeVisible();
  await evidence.record({
    step: "support-human-handoff-and-admin-reply",
    status: "passed",
    path: verifyPage.url(),
  });
  await evidence.flush();
  await verifyContext.close();
});

test("restores a support draft when sending fails", async ({ page }) => {
  await signInBetaIdentity(page, identities.bidderB);
  await page.goto("/dashboard/support");
  await expect(page).toHaveURL(/\?c=/, { timeout: 20_000 });
  const previousConversationId = new URL(page.url()).searchParams.get("c");
  await page.getByRole("button", { name: "+ New", exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("c"), {
      timeout: 20_000,
    })
    .not.toBe(previousConversationId);

  const draft = `QA ${runId}: preserve this message after a failed send.`;
  await page.route("**/support/conversations/*/messages", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Forced support send failure" }),
    });
  });
  const composer = page.getByPlaceholder(/Type a message/);
  await composer.fill(draft);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(composer).toHaveValue(draft);
  await expect(page.getByText("Forced support send failure")).toBeVisible();
});
