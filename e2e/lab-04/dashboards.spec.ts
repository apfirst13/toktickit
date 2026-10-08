import { test, expect } from '@playwright/test';

test.describe('Dashboards', () => {
  test('Requester dashboard renders properly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Login as requester
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Go to dashboard
    await page.waitForSelector('button[data-testid="nav-dashboard"]');
    await page.click('button[data-testid="nav-dashboard"]');

    // Check for dashboard elements
    await expect(page.locator('text=My Tickets Dashboard')).toBeVisible();
    await expect(page.locator('text=Open Tickets')).toBeVisible();
    await expect(page.locator('text=Recently Updated Tickets')).toBeVisible();
  });

  test('Staff dashboard renders properly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Login as staff
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Go to dashboard
    await page.waitForSelector('button[data-testid="nav-dashboard"]');
    await page.click('button[data-testid="nav-dashboard"]');

    // Check for dashboard elements
    await expect(page.locator('text=IT Staff Dashboard')).toBeVisible();
    await expect(page.locator('text=New Tickets')).toBeVisible();
  });
});
