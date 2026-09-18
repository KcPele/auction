import { expect, test, type Page } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import { BetaEvidence } from "./helpers/beta-evidence";
import { createBetaIdentities } from "./helpers/beta-identities";

const runId = process.env.E2E_BETA_RUN_ID ?? "20260917a";
const identities = createBetaIdentities(runId);
const carTitle = `2020 QA-${runId} Corolla`;
const carAuctionId = "218fdd9e-ecea-4775-8468-7d1979ac8766";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot",
  "/reset?token=inventory-placeholder",
  "/otp?ctx=login&email=inventory@bidnaija.local",
  "/verified",
];

const userRoutes = [
  "/dashboard",
  "/dashboard/browse",
  "/dashboard/bids",
  "/dashboard/won",
  "/dashboard/deliveries",
  "/dashboard/wallet",
  "/dashboard/wallet/topup",
  "/dashboard/wallet/withdrawals",
  "/dashboard/listings",
  "/dashboard/listings/create",
  "/dashboard/listing-access",
  "/dashboard/redeem",
  "/dashboard/notifications",
  "/dashboard/watchlist",
  "/dashboard/support",
  "/dashboard/profile",
  `/dashboard/auction/${carAuctionId}`,
  `/dashboard/auction/${carAuctionId}/payment`,
  `/dashboard/auction/${carAuctionId}/delivery`,
  "/kyc?ctx=account",
];

const adminRoutes = [
  "/admin",
  "/admin/auctions",
  "/admin/access-codes",
  "/admin/listings",
  "/admin/disputes",
  "/admin/users",
  "/admin/mechanics",
  "/admin/payments",
  "/admin/withdrawals",
  "/admin/settlements",
  "/admin/notifications",
  "/admin/support",
  "/admin/health",
  "/admin/settings",
];

async function assertRouteHealth(
  page: Page,
  route: string,
  evidence: BetaEvidence,
  viewport: string,
) {
  const startedAt = Date.now();
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Application error")).toHaveCount(0);
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
  const overflow = await page.evaluate(
    () =>
      Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
      document.documentElement.clientWidth,
  );
  expect(overflow, `${route} has horizontal overflow`).toBeLessThanOrEqual(1);
  expect(response?.status() ?? 200, `${route} navigation failed`).toBeLessThan(500);
  await evidence.record({
    step: `${viewport}:${route}`,
    status: "passed",
    path: page.url(),
    details: { navigationMs: Date.now() - startedAt, overflowPx: overflow },
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`inventories public, user, and admin screens at ${viewport.name}`, async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const evidence = new BetaEvidence(`${runId}-screens-${viewport.name}`);

    const publicContext = await browser.newContext({ viewport });
    const publicPage = await publicContext.newPage();
    evidence.observe(publicPage);
    for (const route of publicRoutes) {
      await assertRouteHealth(publicPage, route, evidence, viewport.name);
    }
    await publicContext.close();

    const userContext = await browser.newContext({ viewport });
    const userPage = await userContext.newPage();
    evidence.observe(userPage);
    await signInBetaIdentity(userPage, identities.bidderB);
    for (const route of userRoutes) {
      await assertRouteHealth(userPage, route, evidence, viewport.name);
    }
    await userContext.close();

    const sellerContext = await browser.newContext({ viewport });
    const sellerPage = await sellerContext.newPage();
    evidence.observe(sellerPage);
    await signInBetaIdentity(sellerPage, identities.carDealer);
    await sellerPage.goto("/dashboard/listings");
    const listingCard = sellerPage
      .getByText(carTitle, { exact: true })
      .locator("xpath=ancestor::div[.//a[normalize-space()='View']][1]");
    const listingPath = await listingCard.getByRole("link", { name: "View" }).getAttribute("href");
    expect(listingPath).toBeTruthy();
    await assertRouteHealth(sellerPage, listingPath!, evidence, viewport.name);
    await assertRouteHealth(sellerPage, `${listingPath}/edit`, evidence, viewport.name);
    await sellerContext.close();

    const adminContext = await browser.newContext({ viewport });
    const adminPage = await adminContext.newPage();
    evidence.observe(adminPage);
    await signInBetaIdentity(adminPage, identities.admin);
    for (const route of adminRoutes) {
      await assertRouteHealth(adminPage, route, evidence, viewport.name);
    }
    await evidence.flush();
    await adminContext.close();
  });
}
