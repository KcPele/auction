import { expect, test, type Page } from "@playwright/test";

interface Credentials {
  email: string;
  password: string;
}

const userCredentials = credentialsFromEnv("E2E_USER");
const adminCredentials = credentialsFromEnv("E2E_ADMIN");

function credentialsFromEnv(prefix: "E2E_USER" | "E2E_ADMIN") {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : null;
}

async function signIn(page: Page, credentials: Credentials, destination: string) {
  await page.goto(`/login?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("Email address").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
}

async function assertHealthyScreen(page: Page, path: string) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Application error")).toHaveCount(0);
}

test.describe("authenticated user navigation", () => {
  test.skip(
    !userCredentials,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to exercise user routes.",
  );

  test("every user sidebar destination opens", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page, userCredentials!, "/dashboard");

    const destinations = [
      ["Home", "/dashboard"],
      ["Browse auctions", "/dashboard/browse"],
      ["My bids", "/dashboard/bids"],
      ["Won auctions", "/dashboard/won"],
      ["Deliveries", "/dashboard/deliveries"],
      ["Wallet", "/dashboard/wallet"],
      ["My listings", "/dashboard/listings"],
      ["Listing access", "/dashboard/listing-access"],
      ["Notifications", "/dashboard/notifications"],
      ["Watchlist", "/dashboard/watchlist"],
      ["Contact support", "/dashboard/support"],
      ["Profile & settings", "/dashboard/profile"],
    ] as const;

    for (const [label, path] of destinations) {
      await page
        .locator("aside aside")
        .getByRole("link", { name: label, exact: true })
        .click();
      await assertHealthyScreen(page, path);
    }
  });

  test("secondary user routes open", async ({ page }) => {
    await signIn(page, userCredentials!, "/dashboard");

    for (const path of [
      "/dashboard/listings/create",
      "/dashboard/wallet/topup",
      "/dashboard/wallet/withdrawals",
      "/dashboard/redeem",
    ]) {
      await page.goto(path);
      await assertHealthyScreen(page, path);
    }

    await page.goto("/kyc?ctx=account");
    await expect(page).toHaveURL(/\/(kyc\?ctx=account|dashboard\/profile)$/);
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("authenticated admin navigation", () => {
  test.skip(
    !adminCredentials,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to exercise admin routes.",
  );

  test("every admin sidebar destination opens", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page, adminCredentials!, "/admin");

    const destinations = [
      ["Dashboard", "/admin"],
      ["Live auctions", "/admin/auctions"],
      ["Access codes", "/admin/access-codes"],
      ["Listing approvals", "/admin/listings"],
      ["Disputes", "/admin/disputes"],
      ["Users & wallets", "/admin/users"],
      ["Mechanics", "/admin/mechanics"],
      ["Payments & ledger", "/admin/payments"],
      ["Withdrawal monitor", "/admin/withdrawals"],
      ["Settlements", "/admin/settlements"],
      ["Notifications log", "/admin/notifications"],
      ["Support", "/admin/support"],
      ["System health", "/admin/health"],
      ["Settings", "/admin/settings"],
    ] as const;

    for (const [label, path] of destinations) {
      await page
        .locator("#admin-navigation")
        .getByRole("link", { name: label })
        .click();
      await assertHealthyScreen(page, path);
    }
  });
});
