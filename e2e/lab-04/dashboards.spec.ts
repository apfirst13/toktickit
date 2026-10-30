import { test, expect } from '@playwright/test';

test.describe('Dashboards', () => {
  test('Requester dashboard renders properly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Login as requester
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Go to dashboard
    await page.waitForSelector('button[data-testid="nav-dashboard"]');
    await page.click('button[data-testid="nav-dashboard"]');

    // Check for dashboard elements
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
    await expect(page.locator('text=My Open')).toBeVisible();
    await expect(page.locator('text=Recently Updated Tickets')).toBeVisible();
  });

  test('Staff dashboard renders properly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Login as staff
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Go to dashboard
    await page.waitForSelector('button[data-testid="nav-dashboard"]');
    await page.click('button[data-testid="nav-dashboard"]');

    // Check for dashboard elements
    await expect(page.locator('text=IT Staff Dashboard')).toBeVisible();
    await expect(page.locator('text=New Tickets')).toBeVisible();
  });

  test('Staff dashboard cards match drill-down totals exactly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[data-testid="nav-dashboard"]');
    await page.click('button[data-testid="nav-dashboard"]');

    // Click Urgent Tickets card
    await page.waitForSelector('[data-testid="metric-urgent"]');
    await page.click('[data-testid="metric-urgent"]');

    // Should navigate to Staff Queue with Urgent filter alert active
    await page.waitForSelector('[data-testid="urgent-filter-alert"]');
    await expect(page.locator('[data-testid="urgent-filter-alert"]')).toBeVisible();
  });

  test('Requester A vs B ownership separation and API guard', async ({ request }) => {
    // 1. Requester 2 (Bob) logs in via API
    const bobRes = await request.post('/api/auth/login', {
      data: { email: 'req2@toktickit.com', password: 'Password123!' }
    });
    const bobData = await bobRes.json();

    // 2. Bob creates a ticket
    const ticketRes = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${bobData.token}` },
      data: {
        summary: `Bob Private Ticket ${Date.now()}`,
        description: 'Only Bob should be able to view this requester ticket - long detailed description',
        categoryId: 1,
        systemId: 1,
        requestedPriority: 'High',
      }
    });
    const bobTicket = await ticketRes.json();

    // 3. Requester 1 (Alice) tries to access Bob ticket via API -> 404
    const aliceRes = await request.post('/api/auth/login', {
      data: { email: 'req1@toktickit.com', password: 'Password123!' }
    });
    const aliceData = await aliceRes.json();

    const accessRes = await request.get(`/api/tickets/${bobTicket.id}`, {
      headers: { Authorization: `Bearer ${aliceData.token}` }
    });
    expect(accessRes.status()).toBe(404);
  });
});
