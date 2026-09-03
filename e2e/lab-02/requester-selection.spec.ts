import { test, expect } from "@playwright/test";
import fs from "fs";

test.describe("Requester Selection (Lab 2)", () => {
  test("should display active requesters, allow selection and capture screenshot", async ({ page }) => {
    // We assume the frontend is running on 5173
    await page.goto("http://localhost:5173");
    
    // Wait for the dropdown to be populated
    const select = page.locator("data-testid=requester-dropdown");
    await expect(select).toBeVisible({ timeout: 10000 });
    
    // Select the first option
    await select.selectOption({ index: 0 });
    
    // Click continue
    const continueBtn = page.locator("data-testid=continue-btn");
    await continueBtn.click();
    
    // Check that we transitioned to the Create Ticket screen
    await expect(page.locator("text=Create IT Support Ticket")).toBeVisible();
    
    // Create artifacts directory if not exists
    if (!fs.existsSync("artifacts/lab-02/screenshots")) {
      fs.mkdirSync("artifacts/lab-02/screenshots", { recursive: true });
    }
    
    // Capture screenshot
    await page.screenshot({ path: "artifacts/lab-02/screenshots/requester-selection-success.png", fullPage: true });
  });
});

