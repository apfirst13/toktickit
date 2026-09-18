import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('Valid credentials return session and identity (AC-01, FR-01)', async ({ page }) => {
    // Start at the home page which should show Login
    await page.goto('/');

    await expect(page.locator('text=Authentication Required')).toBeVisible();

    // Fill the real login form
    await page.locator('label:has-text("Email")').locator('..').locator('input').fill('admin@toktickit.com');
    await page.locator('label:has-text("Password")').locator('..').locator('input').fill('Password123!');
    
    // Submit
    await page.locator('button:has-text("Login")').click();

    // Verify UI recognizes the user
    await expect(page.locator('text=Logged in as:')).toBeVisible();
    await expect(page.locator('text=Super Admin')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');

    // Verify logged out
    await expect(page.locator('text=Authentication Required')).toBeVisible();
  });

  test('mustChangePassword=true blocks/redirects (AC-02, FR-02)', async ({ page, request }) => {
    // 1. Admin creates a new user via API for testing convenience
    const adminRes = await request.post('/api/auth/login', {
      data: { email: 'admin@toktickit.com', password: 'Password123!' }
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    const uniqueEmail = `newuser_${Date.now()}@toktickit.com`;
    const createRes = await request.post('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        email: uniqueEmail,
        fullName: 'New User',
        role: 'REQUESTER',
        initialPassword: 'TempPassword1!'
      }
    });
    if (!createRes.ok()) {
      console.log(await createRes.text());
    }
    expect(createRes.ok()).toBeTruthy();

    // 2. New user logs in via UI
    await page.goto('/');
    await page.locator('label:has-text("Email")').locator('..').locator('input').fill(uniqueEmail);
    await page.locator('label:has-text("Password")').locator('..').locator('input').fill('TempPassword1!');
    await page.locator('button:has-text("Login")').click();

    // Verify blocked by Security Alert / Change Password Form
    const alert = page.getByTestId('must-change-password-alert');
    await expect(alert).toBeVisible();
    await expect(page.locator('text=You must set a new password')).toBeVisible();

    // 3. User changes password
    await page.getByTestId('new-password-input').fill('NewStrongP@ss1!');
    await page.getByTestId('confirm-password-input').fill('NewStrongP@ss1!');
    await page.getByTestId('change-password-submit').click();

    // Verify successfully logged in after changing password
    await expect(page.locator('text=Logged in as:')).toBeVisible();
    await expect(page.locator('text=New User')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page.locator('text=Authentication Required')).toBeVisible();
  });

});
