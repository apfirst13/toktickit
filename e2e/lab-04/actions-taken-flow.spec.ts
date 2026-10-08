import { test, expect } from '@playwright/test';

test.describe('ActionsTakenList rapid-click guard (Issue 7 / Lab 4)', () => {

  test('ActionsTaken duplicate-submit: state guard must block repeat submissions on rapid clicks', async ({ page }) => {
    // Login as IT Staff
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for App to load and nav button to appear
    await page.waitForSelector('button[data-testid="nav-staff-queue"]');
    await page.click('button[data-testid="nav-staff-queue"]');

    // Find the first ticket in the queue and click its View button
    await page.waitForSelector('button:has-text("View")');
    await page.locator('button:has-text("View")').first().click();

    // Now we should be on the TicketDetail page
    // Wait for the "+ Add Action" button to appear
    await page.waitForSelector('button:has-text("+ Add Action")');
    await page.click('button:has-text("+ Add Action")');
    
    await page.waitForSelector('[data-testid="action-taken-form"]');

    // Fill in the form
    const uniqueDesc = `Rapid Click Action ${Date.now()}`;
    await page.fill('textarea[placeholder="What did you do?"]', uniqueDesc);
    await page.fill('textarea[placeholder="What was the outcome?"]', 'Test result for rapid click guard verification');

    // Rapidly click Save Action 4 times synchronously
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        btn.click();
        btn.click();
        btn.click();
      }
    });

    // Wait for submission to complete
    await page.waitForTimeout(3000);

    // Assert via DOM search - newly created action should be rendered in the list
    const count = await page.locator(`text=${uniqueDesc}`).count();
    
    expect(count).toBe(1);
  });
});
