import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('Valid credentials return session and identity (AC-01, FR-01)', async ({ page, request }) => {
    // Simulate Login via API because UI is pending
    const res = await request.post('/api/auth/login', {
      data: { email: 'req1@toktickit.com', password: 'Password123!' }
    });
    
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.token).toBeDefined();

    // Inject token to simulate logged in state
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.token);
    await page.reload();

    // Verify UI recognizes the user
    await expect(page.locator('text=Logged in as:')).toBeVisible();
    await expect(page.locator('text=Alice Requester')).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');

    // Verify logged out
    await expect(page.locator('text=Authentication Required')).toBeVisible();
  });

  test('mustChangePassword=true blocks/redirects (AC-02, FR-02)', async ({ page, request }) => {
    // 1. Admin creates a new user
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
    expect(createRes.ok()).toBeTruthy();

    // 2. New user logs in
    const loginRes = await request.post('/api/auth/login', {
      data: { email: uniqueEmail, password: 'TempPassword1!' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const userData = await loginRes.json();
    expect(userData.user.mustChangePassword).toBe(true);

    // 3. UI should block access
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, userData.token);
    await page.reload();

    // Verify blocked by Security Alert
    const alert = page.getByTestId('must-change-password-alert');
    await expect(alert).toBeVisible();
    await expect(page.locator('text=You must change your temporary password')).toBeVisible();

    // Verify logout works from the alert
    await page.click('[data-testid="must-change-password-alert"] button:has-text("Logout")');
    await expect(page.locator('text=Authentication Required')).toBeVisible();
  });

});
