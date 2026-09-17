import { test, expect, Page } from '@playwright/test';

async function loginAs(page: Page, request: any, email: string) {
  const res = await request.post('/api/auth/login', {
    data: { email, password: 'Password123!' }
  });
  const data = await res.json();
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, data.token);
  await page.reload();
}

test.describe('Admin User Management Flow', () => {

  test('Admin creates user, handles duplicate email gracefully (AC-06, FR-08)', async ({ page, request }) => {
    await loginAs(page, request, 'admin@toktickit.com');

    // 1. Navigate to Users
    await page.click('[data-testid="nav-users"]');
    await expect(page.locator('table')).toBeVisible();

    // 2. Open Create Modal
    await page.click('button:has-text("+ Create User")');
    await expect(page.locator('div.modal-content')).toBeVisible();

    // 3. Fill and Submit new user
    const email = `testuser_${Date.now()}@toktickit.com`;
    await page.locator('.modal-content input[type="email"]').fill(email);
    await page.locator('.modal-content input').nth(1).fill('Test User E2E');
    await page.fill('[data-testid="input-password"]', 'Password123!');
    // Ensure role is REQUESTER
    await page.locator('.modal-content select').first().selectOption({ label: 'Requester' });
    
    await page.click('button[data-testid="save-btn"]');

    // 4. Verify user appears in table
    // Close modal happens automatically or we check success message
    await expect(page.locator('div.modal-content')).not.toBeVisible();
    await expect(page.locator(`text=${email}`)).toBeVisible();

    // 5. Try creating a user with the SAME email to trigger duplicate error
    await page.click('button:has-text("+ Create User")');
    await expect(page.locator('div.modal-content')).toBeVisible();

    await page.locator('.modal-content input[type="email"]').fill(email); // duplicate
    await page.locator('.modal-content input').nth(1).fill('Duplicate Test');
    await page.fill('[data-testid="input-password"]', 'Password123!');
    await page.click('button[data-testid="save-btn"]');

    // 6. Verify duplicate email error is handled gracefully
    await expect(page.locator('text=Email already in use')).toBeVisible();

    // Close the modal manually since it stayed open on error
    await page.click('button:has-text("Cancel")');
  });

});
