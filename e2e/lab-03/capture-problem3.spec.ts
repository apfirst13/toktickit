import { test, expect } from '@playwright/test';

test('Capture Problem 3: Admin Guards', async ({ page, request }) => {
  // Login as admin
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'admin@toktickit.com', password: 'Password123!' }
  });
  const { token } = await loginRes.json();

  // Create Admin 2
  const admin2Email = `admin2_${Date.now()}@toktickit.com`;
  await request.post('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { email: admin2Email, fullName: 'Admin Two', role: 'ADMINISTRATOR', initialPassword: 'Password123!' }
  });

  // Login as Admin 1 in UI
  await page.goto('/');
  await page.fill('input[type="email"]', 'admin@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Super Admin');

  await page.click('button:has-text("Users")');
  await page.waitForSelector('text=User Management');

  // Find Admin 1 row and click Edit
  const admin1Row = page.locator('[data-testid^="user-row-"]').filter({ hasText: 'admin@toktickit.com' });
  await admin1Row.locator('[data-testid^="edit-btn-"]').click();
  await page.uncheck('[data-testid="input-isactive"]');
  await page.click('[data-testid="save-btn"]');
  
  // Should get self-deactivate blocked
  await expect(page.locator('text=Administrators cannot deactivate or change role of themselves')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-self-deactivate-blocked.png' });
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(500);

  // Deactivate Admin 2 via API so Admin 1 is the LAST active admin
  const usersRes = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const users = await usersRes.json();
  const admin2 = users.find((u: any) => u.email === admin2Email);
  
  await request.patch(`/api/admin/users/${admin2.id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { isActive: false }
  });

  // Re-navigate to Users page to reflect changes cleanly without reload
  await page.goto('/');
  await page.click('button:has-text("Users")');
  await page.waitForSelector('text=User Management');

  // Admin 1 row again
  const admin1RowAgain = page.locator('[data-testid^="user-row-"]').filter({ hasText: 'admin@toktickit.com' });
  await admin1RowAgain.locator('[data-testid^="edit-btn-"]').click();
  await page.uncheck('[data-testid="input-isactive"]');
  await page.click('[data-testid="save-btn"]');

  // Should get last admin blocked
  await expect(page.locator('text=Cannot remove the last active administrator')).toBeVisible();
  await page.screenshot({ path: 'artifacts/lab-03/screenshots/admin-last-admin-blocked.png' });
});
