import { expect, test } from "@playwright/test";

const email = process.env.E2E_KYC_EMAIL;
const password = process.env.E2E_KYC_PASSWORD;

test.skip(
  !process.env.E2E_KYC_SANDBOX || !email || !password,
  "Set E2E_KYC_SANDBOX, E2E_KYC_EMAIL, and E2E_KYC_PASSWORD to run provider sandbox KYC.",
);

test("provider sandbox completes NIN and BVN verification", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/login?next=%2Fkyc%3Fctx%3Daccount");
  await page.getByLabel("Email address").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await expect(page).toHaveURL(/\/kyc\?ctx=account$/);

  await page.getByLabel("NIN").fill("12345678901");
  await page.getByLabel("First name").fill("JOHN");
  await page.getByLabel("Surname").fill("DOE");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Phone").fill("08012345002");
  await page.getByRole("button", { name: "Verify NIN" }).click();
  await expect(page.getByRole("heading", { name: "Verify your BVN." })).toBeVisible();

  await page.getByLabel("BVN").fill("12345678901");
  await page.getByLabel("First name").fill("JOHN");
  await page.getByLabel("Last name").fill("DOE");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Phone number").fill("08012345002");
  await page.getByRole("button", { name: "Verify BVN" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your BVN." })).toBeVisible();

  await page.getByLabel("OTP").fill("123456");
  await page.getByRole("button", { name: "Confirm BVN" }).click();
  await expect(
    page.getByRole("heading", { name: "Create your payment account." }),
  ).toBeVisible();
});
