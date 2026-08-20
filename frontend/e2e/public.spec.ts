import { expect, test, type Page } from "@playwright/test";

function capturePageErrors(page: Page) {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

test.describe("public experience", () => {
  test("signup requests an email OTP before opening verification", async ({
    page,
  }) => {
    let otpRequest: unknown = null;
    await page.route("**/api/v1/auth/sign-up/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { id: "e2e-user" }, token: null }),
      });
    });
    await page.route(
      "**/api/v1/auth/email-otp/send-verification-otp",
      async (route) => {
        otpRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: true }),
        });
      },
    );

    await page.goto("/register");
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByLabel("Phone number")).toHaveCount(0);
    await page.getByLabel("First name").fill("E2E");
    await page.getByLabel("Last name").fill("Signup");
    await page.getByLabel("Email address").fill("signup@bidnaija.local");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await page.getByLabel("Phone number").fill("8012345999");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("BidNaija!2026QA");
    await page.getByText(/I agree to BidNaija/).click();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/otp\?/);
    expect(otpRequest).toEqual({
      email: "signup@bidnaija.local",
      type: "email-verification",
    });
  });

  test("signup validates each step and preserves entered details", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByText("Required").first()).toBeVisible();

    await page.getByLabel("First name").fill("Adaeze");
    await page.getByLabel("Last name").fill("Okafor");
    await page.getByLabel("Email address").fill("adaeze@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Phone number").fill("8012345678");
    await page.getByLabel("Account type").selectOption("CAR_DEALER");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Step 3 of 3")).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Phone number")).toHaveValue("8012345678");
    await expect(page.getByLabel("Account type")).toHaveValue("CAR_DEALER");
  });

  test("landing page exposes the key journey without visual regressions", async ({
    page,
  }) => {
    const errors = capturePageErrors(page);

    await page.goto("/");

    await expect(page).toHaveTitle(/BidNaija/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Buy and sell with confidence.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();

    const primaryAction = page.getByRole("link", {
      name: "Create account",
    }).first();
    await expect(primaryAction).toBeVisible();
    await expect(primaryAction).toHaveCSS("background-image", "none");
    const themedButtonBackground = await page.evaluate(() => {
      const button = document.createElement("button");
      button.className = "button-primary";
      document.body.append(button);
      const background = getComputedStyle(button).backgroundImage;
      button.remove();
      return background;
    });
    expect(themedButtonBackground).toBe("none");

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      /bidnaija-mark\.svg/,
    );
    await expect(page.locator('meta[name="author"]')).toHaveAttribute(
      "content",
      "Kcpele",
    );
    await expect(page.locator('meta[name="creator"]')).toHaveAttribute(
      "content",
      "Kcpele",
    );
    await expect(page.locator('meta[name="built-by"]')).toHaveAttribute(
      "content",
      "Kcpele",
    );

    await page.getByRole("link", { name: "Browse auctions" }).first().click();
    await expect(page).toHaveURL(/#auctions$/);

    expect(errors).toEqual([]);
  });

  test("landing navigation reaches login and registration", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Log in" })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: "Start with the basics." }),
    ).toBeVisible();
  });

  test("password recovery and verification screens remain usable", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot?" }).click();
    await expect(page).toHaveURL(/\/forgot$/);
    await expect(
      page.getByRole("heading", { name: "Forgot your password?" }),
    ).toBeVisible();

    await page.goto("/reset?token=e2e-placeholder-token");
    await expect(
      page.getByRole("heading", { name: "Create new password." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Reset password/ }),
    ).toBeDisabled();

    await page.goto("/otp?ctx=login&email=qa@example.com");
    await expect(
      page.getByRole("heading", { name: "Enter the 6-digit code." }),
    ).toBeVisible();
    await expect(page.getByText("qa@example.com")).toBeVisible();
  });

  test("public pages fit a small mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const viewport = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));

    expect(Math.max(viewport.body, viewport.document)).toBeLessThanOrEqual(
      viewport.viewport,
    );
    await expect(
      page.getByRole("link", { name: "Create account" }).first(),
    ).toBeVisible();

    await page.goto("/register");
    const registerViewport = await page.evaluate(() => ({
      content: Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
      ),
      viewport: document.documentElement.clientWidth,
    }));
    expect(registerViewport.content).toBeLessThanOrEqual(
      registerViewport.viewport,
    );

    const firstName = await page.getByLabel("First name").boundingBox();
    const lastName = await page.getByLabel("Last name").boundingBox();
    expect(firstName).not.toBeNull();
    expect(lastName).not.toBeNull();
    expect(lastName!.y).toBeGreaterThan(firstName!.y);
  });
});
