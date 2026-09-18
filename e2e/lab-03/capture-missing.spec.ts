import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

test.use({ viewport: { width: 1280, height: 720 } });

async function loginAs(page: Page, request: any, email: string) {
  const res = await request.post('/api/auth/login', { data: { email, password: 'Password123!' } });
  const data = await res.json();
  await page.goto('/');
  await page.evaluate((token) => localStorage.setItem('token', token), data.token);
  return data.token;
}

test.describe('Capture Missing Screenshots for Submission', () => {

  test('Login empty / valid / invalid', async ({ page }) => {
    await page.goto('/login');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/login-empty.png' });

    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/login-invalid.png' });
  });

  test('Inactive account error', async ({ page, request }) => {
    const adminToken = await loginAs(page, request, 'admin@toktickit.com');
    const inactiveEmail = `inactive_${Date.now()}@toktickit.com`;
    await request.post('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { email: inactiveEmail, fullName: 'Inactive', role: 'REQUESTER', initialPassword: 'Password123!' }
    });
    // Deactivate it
    const usersRes = await request.get('/api/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    const users = await usersRes.json();
    const target = users.find((u: any) => u.email === inactiveEmail);
    await request.put(`/api/admin/users/${target.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isActive: false }
    });

    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/login');
    await page.fill('input[type="email"]', inactiveEmail);
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toContainText('Account is deactivated');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/login-inactive.png' });
  });

  test('Authenticated shell showing user + role', async ({ page, request }) => {
    await loginAs(page, request, 'admin@toktickit.com');
    await page.goto('/');
    await page.click('[data-testid="nav-user-menu"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/auth-shell-role.png' });
  });

  test('Search / filter / sort in action', async ({ page, request }) => {
    await loginAs(page, request, 'staff1@toktickit.com');
    await page.goto('/');
    await page.click('[data-testid="nav-staff-queue"]');
    await page.fill('input[placeholder="Search tickets..."]', 'login');
    await page.selectOption('select:has(option[value="OPEN"])', 'OPEN');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/queue-search-filter.png' });
  });

  test('Empty state and no-results state', async ({ page, request }) => {
    await loginAs(page, request, 'staff1@toktickit.com');
    await page.goto('/');
    await page.click('[data-testid="nav-staff-queue"]');
    await page.fill('input[placeholder="Search tickets..."]', 'NONEXISTENTTICKETXYZ123');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/queue-no-results.png' });
  });

  test('Create / Edit user form + validation errors', async ({ page, request }) => {
    await loginAs(page, request, 'admin@toktickit.com');
    await page.goto('/');
    await page.click('[data-testid="nav-users"]');
    await page.click('button:has-text("Create New User")');
    await page.waitForSelector('.modal.show');
    await page.click('.modal.show button:has-text("Save")'); // Trigger validation
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-create-validation.png' });
  });

  test('Self-deactivation guard blocked', async ({ page, request }) => {
    await loginAs(page, request, 'admin@toktickit.com');
    await page.goto('/');
    await page.click('[data-testid="nav-users"]');
    
    // Find admin in table and click Edit
    await page.locator('tr:has-text("admin@toktickit.com")').locator('button:has-text("Edit")').click();
    await page.waitForSelector('.modal.show');
    
    // Uncheck active
    await page.uncheck('.modal.show input[type="checkbox"]');
    await page.click('.modal.show button:has-text("Save")');
    await expect(page.locator('.toast-body')).toContainText('Cannot deactivate yourself');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-self-deactivate-blocked.png' });
  });

  test('Forbidden access (non-Administrator)', async ({ page, request }) => {
    await loginAs(page, request, 'staff1@toktickit.com'); // Staff trying to access Admin
    await page.goto('/users');
    await expect(page.locator('text=Unauthorized')).toBeVisible();
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-forbidden.png' });
  });

});
