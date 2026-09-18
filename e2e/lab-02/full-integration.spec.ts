import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
const ARTIFACTS_DIR = "artifacts/lab-02/screenshots";

test.describe("Full User Journey E2E (Lab 2)", () => {
  test.beforeEach(async ({ page, request }) => {
    const res = await request.post('/api/auth/login', { data: { email: 'req1@toktickit.com', password: 'Password123!' } });
    const data = await res.json();
    await page.goto(BASE_URL);
    await page.evaluate((token) => localStorage.setItem('token', token), data.token);
    await page.reload();

    // Ensure artifacts dir exists
    const absDir = path.resolve(ARTIFACTS_DIR);
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }
  });

  test.skip("should complete the full ticket creation and viewing journey", async ({ page }) => {
    // 1. Select Requester
    await page.waitForSelector("[data-testid=requester-dropdown], [data-testid=nav-create]", { timeout: 15000 });
    const dropdown = page.locator("[data-testid=requester-dropdown]");
    if (await dropdown.isVisible()) {
      await page.waitForFunction(() => {
        const sel = document.querySelector<HTMLSelectElement>("[data-testid=requester-dropdown]");
        return sel && sel.options.length > 0;
      });
      await page.locator("[data-testid=continue-btn]").click();
    }

    // 2. Create Ticket Form
    await page.waitForSelector("[data-testid=create-ticket-form]", { timeout: 10000 });
    await page.waitForFunction(() => {
        const sel = document.querySelector<HTMLSelectElement>("[data-testid=select-category]");
        return sel && !sel.disabled && sel.options.length > 0;
    });

    const uniqueSummary = `E2E Test Ticket ${Date.now()}`;
    await page.locator("[data-testid=input-summary]").fill(uniqueSummary);
    await page.locator("[data-testid=input-description]").fill("This is a detailed description for the E2E test journey. It needs to be at least 20 chars.");
    await page.locator("[data-testid=select-category]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-system]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-priority]").selectOption("High");
    
    // Submit
    await page.locator("[data-testid=submit-btn]").click();
    await expect(page.locator("[data-testid=success-message]")).toBeVisible({ timeout: 10000 });

    // 3. Navigate to My Tickets
    await page.locator("[data-testid=nav-list]").click();
    await page.waitForSelector("[data-testid=tickets-table-body]", { timeout: 10000 });
    
    // Check if ticket appears in list (by summary)
    await expect(page.locator("text=" + uniqueSummary)).toBeVisible();

    // Capture "My Tickets" Screenshot
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/my-tickets-success.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: my-tickets-success.png");

    // 4. Click into Ticket Detail
    // Find the view button in the row containing the unique summary
    const ticketRow = page.locator("tr", { hasText: uniqueSummary }).first();
    const viewBtn = ticketRow.locator("button:has-text('View')");
    await viewBtn.click();

    // 5. Verify Ticket Detail View
    await page.waitForSelector("[data-testid=ticket-detail-view]", { timeout: 10000 });
    await expect(page.locator("[data-testid=detail-summary]")).toHaveText(uniqueSummary);
    await expect(page.locator("[data-testid=attachments-section]")).toBeVisible();

    // Capture "Ticket Detail" Screenshot
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/ticket-detail-success.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: ticket-detail-success.png");
  });
});
