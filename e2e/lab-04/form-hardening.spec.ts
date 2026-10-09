import { test, expect } from '@playwright/test';

test.describe('Form Hardening (Issue 7 / Lab 4)', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Requester
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for App to load
    await page.waitForSelector('text=Create IT Support Ticket');
  });

  test('Duplicate-click protection: should create only 1 ticket on rapid clicks', async ({ page }) => {
    const uniqueSummary = `Duplicate Test ${Date.now()}`;
    
    await page.fill('#summary', uniqueSummary);
    await page.fill('#description', 'Testing rapid double clicks here because we need at least 20 chars');
    await page.selectOption('#categoryId', { index: 1 });
    await page.selectOption('#systemId', { index: 1 });
    await page.selectOption('#requestedPriority', { index: 2 });
    
    // Rapidly click the submit button 4 times
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        btn.click();
        btn.click();
        btn.click();
      }
    });

    // Wait for a few seconds to let any network requests finish
    await page.waitForTimeout(2000);

    // Manually navigate to the dashboard / list to check
    await page.click('button[data-testid="nav-dashboard"]');
    // For requester, clicking Dashboard actually goes to Dashboard. We can click "My Open" to see tickets
    await page.waitForSelector('text=My Open');
    await page.click('text=My Open');
    
    // Wait for table to load rows
    await page.waitForTimeout(2000);

    // Count how many tickets have the uniqueSummary
    const count = await page.locator(`td:has-text("${uniqueSummary}")`).count();
    
    expect(count).toBe(1);
  });

  test('Form retention: should not clear form on server error', async ({ page }) => {
    const summaryText = `Fail Test ${Date.now()}`;
    const descText = 'This text should stay intact because it is 20 chars long.';
    
    await page.fill('#summary', summaryText);
    await page.fill('#description', descText);
    await page.selectOption('#categoryId', { index: 1 });
    await page.selectOption('#systemId', { index: 1 });
    await page.selectOption('#requestedPriority', { index: 1 });

    // Intercept API to return 500
    await page.route('**/api/tickets', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error simulated' })
      });
    });

    await page.click('button[type="submit"]');
    
    // Assert error message appears
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    // Assert the fields still contain the original values
    await expect(page.locator('#summary')).toHaveValue(summaryText);
    await expect(page.locator('#description')).toHaveValue(descText);
  });
});
