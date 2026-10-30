import { test, expect } from '@playwright/test';

test.describe('Ticket Resolution Workflow', () => {
  test('Staff can view resolution options', async ({ page }) => {
    // We only perform read-only checks to avoid polluting the DB
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('button[data-testid="nav-staff-queue"]');
    await page.click('button[data-testid="nav-staff-queue"]');

    // Click first ticket
    const link = page.locator('text=TIK-').first();
    await expect(link).toBeVisible();
    await link.click();

    // Verify status dropdown exists (this proves the workflow UI renders)
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Resolution Gate: Cannot resolve ticket without actions taken', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'staff1@toktickit.com', password: 'Password123!' }
    });
    const { token } = await loginRes.json();

    const createRes = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        summary: `Resolution Gate Test Ticket ${Date.now()}`,
        description: 'Testing resolution gate constraint without actions taken - detailed description',
        categoryId: 1,
        systemId: 1,
        requestedPriority: 'High',
      }
    });
    const newTicket = await createRes.json();

    await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'OPEN' }
    });

    await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'IN_PROGRESS' }
    });

    const resolveRes = await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'RESOLVED' }
    });

    expect(resolveRes.status()).toBe(400);
    const body = await resolveRes.json();
    expect(body.error).toContain('Action Taken');
  });

  test('Resolution Gate: Can resolve ticket after adding at least 1 action taken', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'staff1@toktickit.com', password: 'Password123!' }
    });
    const { token } = await loginRes.json();

    const createRes = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        summary: `Resolvable Ticket ${Date.now()}`,
        description: 'Testing successful resolution after adding action taken - detailed description',
        categoryId: 1,
        systemId: 1,
        requestedPriority: 'High',
      }
    });
    const newTicket = await createRes.json();

    await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'OPEN' }
    });

    await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'IN_PROGRESS' }
    });

    await request.post(`/api/tickets/${newTicket.id}/actions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        actionDateTime: new Date().toISOString(),
        description: 'Diagnostic steps completed',
        result: 'Fixed the issue',
        followUpRequired: false,
      }
    });

    const resolveRes = await request.patch(`/api/staff/tickets/${newTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'RESOLVED' }
    });

    expect(resolveRes.ok()).toBeTruthy();
    const resolvedData = await resolveRes.json();
    expect(resolvedData.currentStatus).toBe('RESOLVED');
  });
});
