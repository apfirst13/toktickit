import { test, expect } from '@playwright/test';

test.describe('Capture Part 8: Admin User Management UI Screenshots', () => {

  test('Capture Admin Actions', async ({ page }) => {
    // Log in as Admin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('button:has-text("Logout")');

    await page.click('button:has-text("Users")');
    await page.waitForSelector('text=User Management');

    // Search
    await page.fill('[data-testid="search-input"]', 'staff');
    await page.waitForTimeout(500); // Wait for filter
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-search.png' });
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    
    // Role Filter
    await page.selectOption('[data-testid="role-filter"]', 'IT_STAFF');
    await page.waitForTimeout(500);
    // Open dropdown for screenshot
    await page.locator('[data-testid="role-filter"]').click();
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-role-filter.png' });
    await page.locator('body').click(); // close dropdown
    
    // Reset filter
    await page.selectOption('[data-testid="role-filter"]', '');

    // Edit User
    const editBtn = page.locator('button:has-text("Edit")').first();
    await editBtn.click();
    await page.waitForSelector('text=Edit User');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-edit-modal.png' });
    await page.locator('button:has-text("Cancel")').click(); // Close modal
    
    // Reset Password
    const resetBtn = page.locator('button:has-text("Reset Password")').first();
    await resetBtn.click();
    await page.waitForSelector('text=Temporary Password');
    await page.click('button:has-text("Generate")');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-reset-password.png' });
    await page.locator('button:has-text("Cancel")').click(); // Close modal

    // Duplicate Email Validation
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('text=Create User');
    await page.fill('[data-testid="input-fullname"]', 'Clone User');
    await page.fill('[data-testid="input-email"]', 'staff2@toktickit.com'); // Already exists
    await page.selectOption('[data-testid="input-role"]', 'IT_STAFF');
    await page.click('button:has-text("Generate")');
    await page.click('button:has-text("Save")');
    await page.waitForSelector('text=already in use'); // Wait for validation error
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-duplicate-email.png' });
    await page.locator('button:has-text("Cancel")').click();

  });

});
