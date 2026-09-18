import { expect, test } from "@playwright/test";
import { signInBetaIdentity } from "./helpers/beta-auth";
import type { BetaIdentity } from "./helpers/beta-identities";

const user: BetaIdentity = {
  label: "Listing Access User",
  firstName: "Listing",
  lastName: "Tester",
  email: process.env.E2E_LISTING_ACCESS_EMAIL ?? "",
  phone: process.env.E2E_LISTING_ACCESS_PHONE ?? "+2348000000000",
  password: process.env.E2E_LISTING_ACCESS_PASSWORD ?? "",
  appRole: "INDIVIDUAL_BIDDER",
};

test.use({ viewport: { width: 390, height: 844 } });
test.skip(
  !user.email || !user.password,
  "Set E2E_LISTING_ACCESS_EMAIL and E2E_LISTING_ACCESS_PASSWORD to run this account-specific check.",
);

test("admin-granted access is visible and usable from mobile", async ({
  page,
}) => {
  await signInBetaIdentity(page, user);

  await page.goto("/dashboard/notifications");
  await expect(page.getByText("Car listing access granted")).toBeVisible();

  await page.goto("/dashboard/profile");
  await expect(page.getByText("Cars · Gadgets")).toBeVisible();
  await expect(page.getByRole("link", { name: "My listings" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Create listing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Redeem", exact: true })).toHaveCount(0);

  await page.goto("/dashboard/listing-access");
  const access = page.getByRole("region", { name: "Your active access" });
  await expect(access).toContainText("Cars");
  await expect(access).toContainText("Gadgets");
  await expect(access.getByText("Granted", { exact: true })).toHaveCount(2);

  await access.getByRole("link", { name: "Create listing" }).click();
  await expect(page).toHaveURL(/\/dashboard\/listings\/create$/);
  await expect(page.getByRole("checkbox", { name: "Car" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Gadget" })).toBeVisible();
});

test("browse cards use responsive optimized images on mobile", async ({ page }) => {
  await signInBetaIdentity(page, user);
  await page.goto("/dashboard/browse");

  const firstImage = page.locator("main img").first();
  await expect(firstImage).toBeVisible();
  await expect(firstImage).toHaveAttribute("src", /\/_next\/image\?/);
  await expect(firstImage).toHaveAttribute("srcset", /\/_next\/image\?/);
  await expect(firstImage).toHaveAttribute(
    "sizes",
    "(max-width: 1024px) 50vw, 280px",
  );
});
