import { test, expect } from '@playwright/test';

test.describe('Capture Part 6: Queue UI Screenshots', () => {

  test('Capture Assigned/Unassigned and Badges', async ({ page }) => {
    // Log in as Staff
    await page.goto('/');
    await page.fill('input[type="email"]', 'staff2@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('button:has-text("Logout")');

    // Check if password change is forced
    const passwordAlert = await page.locator('[data-testid="must-change-password-alert"]').count();
    if (passwordAlert > 0) {
      await page.fill('input[type="password"]', 'TokTickIT2024!');
      await page.click('button:has-text("Change Password")');
      await page.click('button:has-text("Staff Queue")');
    await page.waitForSelector('text=IT Staff Ticket Queue');
    }
    
    await page.click('button:has-text("Staff Queue")');
    await page.waitForSelector('text=IT Staff Ticket Queue');

    // Wait for the table rows to render
    await page.waitForSelector('tbody tr');
    
    // Capture the entire table to show assigned vs unassigned, and badges
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/queue-assigned.png' });
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/queue-badges.png' }); // Can be same image, or maybe just crop later if needed
    
    // Hover over the first View button
    const viewBtn = page.locator('button:has-text("View")').first();
    await viewBtn.hover();
    await page.waitForTimeout(500); // let hover effect apply
    
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/queue-open-detail.png' });
  });

});
