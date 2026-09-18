import { test, expect } from '@playwright/test';

test.describe('Capture Part 5: Login UI Screenshots', () => {

  test('Capture Login Busy State', async ({ page }) => {
    // Intercept the login API and delay it heavily
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });

    await page.goto('/');
    await page.waitForSelector('input[type="email"]');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'P@ssw0rd123'); // Doesn't matter if it fails
    
    // Click login and capture immediately while it's spinning
    await page.click('button[type="submit"]');
    
    // Wait for the button text to change to 'Signing in...'
    await page.waitForSelector('button:has-text("Signing in...")');
    
    // Capture
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/login-busy.png' });
  });

  test('Capture Login Valid (Dashboard)', async ({ page }) => {
    // Standard login flow
    await page.goto('/');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!'); // Default seed password
    await page.click('button[type="submit"]');
    
    // Wait for EITHER the dashboard or the password reset form
    await page.waitForSelector('button:has-text("Logout")');
    
    // Check if password change is forced
    const passwordAlert = await page.locator('[data-testid="must-change-password-alert"]').count();
    if (passwordAlert > 0) {
      // Complete password change
      await page.fill('input[type="password"]', 'TokTickIT2024!');
      await page.click('button:has-text("Change Password")');
      await page.waitForSelector('text=My Tickets'); // Wait for reload to dashboard
    }
    
    // Capture the valid dashboard state
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/login-valid.png' });
  });

  test('Capture Logout Action', async ({ page }) => {
    // Log in first
    await page.goto('/');
    await page.fill('input[type="email"]', 'req2@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Ensure we are in the shell
    await page.waitForSelector('button:has-text("Logout")');
    
    // We want to capture the header where the logout button is
    // Wait a brief moment for UI to settle
    await page.waitForTimeout(1000);
    
    // Hover the logout button to show interaction
    await page.hover('button:has-text("Logout")');
    
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/logout-action.png' });
  });

});
