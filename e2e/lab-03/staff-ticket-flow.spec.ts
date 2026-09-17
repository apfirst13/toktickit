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

test.describe('Staff Ticket Flow', () => {

  test('Staff reviews queue, filters, opens ticket, adds note (AC-05, FR-05)', async ({ page, request }) => {
    await loginAs(page, request, 'staff1@toktickit.com');

    // 1. Navigate to Staff Queue
    await page.click('[data-testid="nav-staff-queue"]');
    
    // 2. Wait for table to load
    await expect(page.locator('table')).toBeVisible();

    // 3. Apply a filter (e.g., search for a ticket)
    await page.fill('input[placeholder="Search ticket # or summary..."]', 'TIK-');
    await page.waitForTimeout(500); // Wait for debounce

    // 4. Open the first ticket
    const firstRowViewButton = page.locator('table tbody tr').first().locator('button:has-text("View")');
    await expect(firstRowViewButton).toBeVisible();
    await firstRowViewButton.click();

    // 5. Verify Detail View loaded
    await expect(page.locator('text=IT Operational Controls')).toBeVisible();

    // 6. Add an Internal Note
    const internalNoteText = `Test internal note ${Date.now()}`;
    await page.fill('textarea[placeholder="Add an internal note..."]', internalNoteText);
    await page.click('button:has-text("Save Internal Note")');

    // 7. Verify the note appears
    await expect(page.locator(`text=${internalNoteText}`)).toBeVisible();
  });

});
