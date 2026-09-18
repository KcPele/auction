import { expect, test } from "@playwright/test";
import { BetaEvidence } from "./helpers/beta-evidence";

test.describe("beta readiness", () => {
  test("records browser health evidence", async ({ page }) => {
    const evidence = new BetaEvidence("harness-smoke");
    evidence.observe(page);

    await page.goto("/");
    await expect(page).toHaveTitle(/BidNaija/);
    await expect(
      page.getByRole("link", { name: "BidNaija home" }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await evidence.record({
      step: "landing",
      status: "passed",
      path: page.url(),
    });
    await evidence.flush();

    await expect.poll(() => evidence.outputExists()).toBe(true);
  });
});
