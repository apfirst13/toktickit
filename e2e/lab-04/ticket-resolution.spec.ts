import { test, expect } from '@playwright/test';

test.describe('Ticket Resolution Workflow', () => {
  test('Staff can view resolution options', async ({ page }) => {
    // We only perform read-only checks to avoid polluting the DB
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[data-testid="nav-staff-queue"]');
    await page.click('button[data-testid="nav-staff-queue"]');

    // Click first ticket
    const link = page.locator('text=TIK-').first();
    await expect(link).toBeVisible();
    await link.click();

    // Verify status dropdown exists (this proves the workflow UI renders)
    await expect(page.locator('select').first()).toBeVisible();
  });
});
