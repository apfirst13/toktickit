import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
const ARTIFACTS_DIR = "artifacts/lab-02/screenshots";

test.describe("Create Ticket (Lab 2)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test so we always start fresh
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Ensure artifacts dir exists
    const absDir = path.resolve(ARTIFACTS_DIR);
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }
  });

  async function selectRequesterAndOpenForm(page: import("@playwright/test").Page) {
    // Wait for either the requester dropdown OR the create ticket form to appear.
    // (Handles the case where loading spinner is shown initially)
    await page.waitForSelector("[data-testid=requester-dropdown], [data-testid=create-ticket-form]", { timeout: 15000 });

    const dropdown = page.locator("[data-testid=requester-dropdown]");
    if (await dropdown.isVisible()) {
      // We are on the selection screen. Wait for options to load.
      await page.waitForFunction(() => {
        const sel = document.querySelector<HTMLSelectElement>("[data-testid=requester-dropdown]");
        return sel && sel.options.length > 0;
      });
      // Click continue
      await page.locator("[data-testid=continue-btn]").click();
    }

    // Wait for the ticket form
    await page.waitForSelector("[data-testid=create-ticket-form]", { timeout: 10000 });
    // Wait until category dropdown is populated
    await page.waitForFunction(
      () => {
        const sel = document.querySelector<HTMLSelectElement>("[data-testid=select-category]");
        return sel && !sel.disabled && sel.options.length > 0;
      },
      { timeout: 10000 }
    );
  }

  test("should show validation errors on empty form and capture screenshot", async ({ page }) => {
    await selectRequesterAndOpenForm(page);

    // Clear priority to force error
    await page.locator("[data-testid=select-priority]").selectOption({ value: "" });
    // Clear text fields
    await page.locator("[data-testid=input-summary]").fill("");
    await page.locator("[data-testid=input-description]").fill("");

    // Submit empty form
    await page.locator("[data-testid=submit-btn]").click();

    // Wait for error to appear
    await expect(page.locator("[data-testid=error-summary]")).toBeVisible({ timeout: 5000 });

    // Screenshot of error state
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/create-ticket-error.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: create-ticket-error.png");
  });

  test("should submit a valid form and capture success screenshot", async ({ page }) => {
    await selectRequesterAndOpenForm(page);

    // Fill the form with valid data
    await page.locator("[data-testid=input-summary]").fill("Laptop screen flickering issue in room 201");
    await page.locator("[data-testid=input-description]").fill(
      "My laptop screen has been flickering since yesterday afternoon. It started after I installed a Windows update. The flickering happens every few minutes."
    );
    await page.locator("[data-testid=select-category]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-system]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-priority]").selectOption("High");

    // Submit
    await page.locator("[data-testid=submit-btn]").click();

    // Wait for success message
    await expect(page.locator("[data-testid=success-message]")).toBeVisible({ timeout: 10000 });

    // Screenshot of success state
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/create-ticket-success.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: create-ticket-success.png");
  });
});
