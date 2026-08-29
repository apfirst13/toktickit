import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
const ARTIFACTS_DIR = "artifacts/lab-02/screenshots";

test.describe("Full User Journey E2E (Lab 2)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before test to start fresh
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Ensure artifacts dir exists
    const absDir = path.resolve(ARTIFACTS_DIR);
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }
  });

  test("should complete the full ticket creation, attachment upload, and removal journey", async ({ page }) => {
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

    const uniqueSummary = `E2E Full Flow Ticket ${Date.now()}`;
    await page.locator("[data-testid=input-summary]").fill(uniqueSummary);
    await page.locator("[data-testid=input-description]").fill("This is a detailed description for the E2E full flow journey. It needs to be at least 20 chars.");
    await page.locator("[data-testid=select-category]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-system]").selectOption({ index: 0 });
    await page.locator("[data-testid=select-priority]").selectOption("High");
    
    // Capture "Create Form" Screenshot
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/create-ticket-form.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: create-ticket-form.png");

    // Submit
    await page.locator("[data-testid=submit-btn]").click();
    await expect(page.locator("[data-testid=success-message]")).toBeVisible({ timeout: 10000 });

    // 3. Navigate to My Tickets
    await page.locator("[data-testid=nav-list]").click();
    await page.waitForSelector("[data-testid=tickets-table-body]", { timeout: 10000 });
    
    // Check if ticket appears in list (by summary)
    await expect(page.locator("text=" + uniqueSummary)).toBeVisible();

    // Capture "Ticket List" Screenshot
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/ticket-list.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: ticket-list.png");

    // 4. Click into Ticket Detail
    const ticketRow = page.locator("tr", { hasText: uniqueSummary }).first();
    const viewBtn = ticketRow.locator("button:has-text('View')");
    await viewBtn.click();

    // Verify Ticket Detail View
    await page.waitForSelector("[data-testid=ticket-detail-view]", { timeout: 10000 });
    await expect(page.locator("[data-testid=detail-summary]")).toHaveText(uniqueSummary);
    
    // Upload Attachment
    await expect(page.locator("[data-testid=attachments-section]")).toBeVisible();
    
    // Create a dummy file to upload
    const dummyFilePath = path.join(__dirname, 'dummy-attachment.jpg');
    fs.writeFileSync(dummyFilePath, Buffer.alloc(1024, 'dummy content'));

    const fileInput = page.locator("[data-testid=file-input]");
    await fileInput.setInputFiles(dummyFilePath);
    
    await page.locator("[data-testid=upload-btn]").click();
    
    // Wait for upload success
    await expect(page.locator("[data-testid=upload-success]")).toBeVisible({ timeout: 15000 });
    
    // Verify attachment in list
    const attachmentItem = page.locator("[data-testid^=attachment-item-]");
    await expect(attachmentItem).toBeVisible();
    await expect(attachmentItem).toContainText("dummy-attachment.jpg");

    // Capture "Ticket Detail" Screenshot
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/ticket-detail.png`,
      fullPage: true,
    });
    console.log("✅ Screenshot saved: ticket-detail.png");

    // 5. Soft-remove the attachment
    page.on('dialog', dialog => dialog.accept()); // Accept the confirmation dialog
    const removeBtn = page.locator("[data-testid^=remove-attach-]");
    await removeBtn.click();

    // Verify the UI updates correctly (attachment is removed from list)
    await expect(page.locator("[data-testid=no-attachments]")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid^=attachment-item-]")).not.toBeVisible();

    // Clean up dummy file
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  });
});
