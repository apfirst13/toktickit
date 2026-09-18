import { test, expect } from '@playwright/test';

test('Capture Problem 4: Ticket Detail Safe Failure', async ({ page, request }) => {
  // Login as Requester 1
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'req1@toktickit.com', password: 'Password123!' }
  });
  const { token } = await loginRes.json();

  // Get categories and systems
  const catRes = await request.get('/api/categories');
  const catData = await catRes.json();
  const categoryId = catData[0].id;

  const sysRes = await request.get('/api/systems');
  const sysData = await sysRes.json();
  const systemId = sysData[0].id;

  // Create a ticket
  const ticketRes = await request.post('/api/tickets', {
    headers: { Authorization: `Bearer ${token}` },
    data: { 
      summary: 'Test Ticket for 403', 
      description: 'This is a description', 
      categoryId: categoryId, 
      systemId: systemId,
      requestedPriority: 'Low' 
    }
  });
  const ticket = await ticketRes.json();

  // Login via UI as Requester 1
  await page.goto('/');
  await page.fill('input[type="email"]', 'req1@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Alice Requester');

  // Setup interception for the ticket fetch
  await page.route(`**/api/tickets/${ticket.id}`, route => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Role Restriction: You are not authorized to access this ticket.' })
      });
    } else {
      route.continue();
    }
  });

  // Navigate to My Tickets and wait for the list
  await page.click('button:has-text("My Tickets")');
  await page.waitForSelector(`[data-testid="view-ticket-${ticket.id}"]`);

  // Click View on the ticket
  await page.click(`[data-testid="view-ticket-${ticket.id}"]`);

  // Wait for the safe failure banner
  await expect(page.locator('[data-testid="detail-error"]')).toBeVisible();
  
  // Capture the safe failure
  await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-role-restriction.png' });
});
