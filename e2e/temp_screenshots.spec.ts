import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Capture Lab 2 Screenshots', () => {
  const screenshotsDir = path.join(__dirname, '../artifacts/lab-02/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/requesters', async route => {
      await route.fulfill({
        json: [
          { id: 1, name: 'Alice', email: 'alice@test.com' },
          { id: 2, name: 'Bob', email: 'bob@test.com' }
        ]
      });
    });
    
    await page.route('**/api/categories', async route => {
      await route.fulfill({ json: [{ id: 1, name: 'Hardware' }, { id: 2, name: 'Software' }] });
    });
    await page.route('**/api/systems', async route => {
      await route.fulfill({ json: [{ id: 1, name: 'Laptop' }] });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Alice');
    });
  });

  // Original 5 tests
  test('create-ticket-empty.png', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-empty.png') });
  });

  test('create-ticket-validation-error.png', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="submit-btn"]').click();
    await expect(page.locator('.is-invalid')).toHaveCount(3);
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-validation-error.png') });
  });

  test('create-ticket-submitting.png', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="input-summary"]').fill('My valid summary');
    await page.locator('[data-testid="input-description"]').fill('My valid description that is long enough');
    await page.locator('[data-testid="select-priority"]').selectOption('Low');
    await expect(page.locator('[data-testid="select-category"]')).not.toBeDisabled();
    
    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({ json: { ticketNumber: 'TKT-1234' }, status: 201 });
      } else {
        await route.continue();
      }
    });
    
    const submitBtn = page.locator('[data-testid="submit-btn"]');
    await submitBtn.click();
    await expect(submitBtn).toBeDisabled();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-submitting.png') });
  });

  test('create-ticket-api-failure.png', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="input-summary"]').fill('My valid summary');
    await page.locator('[data-testid="input-description"]').fill('My valid description that is long enough');
    await page.locator('[data-testid="select-priority"]').selectOption('Low');
    
    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.locator('[data-testid="submit-btn"]').click();
    await expect(page.locator('[data-testid="submit-error"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-api-failure.png') });
  });

  test('create-ticket-invalid-attachment.png', async ({ page }) => {
    await page.route(/\/api\/tickets/, async route => {
      const url = route.request().url();
      if (url.match(/\/api\/tickets\?requesterId=\d+/)) {
        await route.fulfill({
          json: {
            data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', status: 'OPEN', createdAt: new Date().toISOString() }]
          },
          status: 200
        });
      } else if (url.match(/\/api\/tickets\/\d+\?requesterId=\d+/)) {
        await route.fulfill({
          json: {
            id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Description',
            currentStatus: 'OPEN', requestedPriority: 'LOW',
            category: { id: 1, name: 'Hardware' }, relatedSystem: { id: 1, name: 'Laptop' },
            createdAt: new Date().toISOString(), attachments: []
          },
          status: 200
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    
    const viewBtn = page.locator('[data-testid^="view-ticket-"]').first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();
    
    await expect(page.locator('[data-testid="file-input"]')).toBeVisible();
    const invalidFile = Buffer.alloc(10);
    await page.locator('[data-testid="file-input"]').setInputFiles({
      name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: invalidFile
    });
    
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-invalid-attachment.png') });
  });

  // NEW 7 TESTS
  
  test('my-tickets-requester-a.png', async ({ page }) => {
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({
        json: {
          data: [
            { id: 101, ticketNumber: 'TKT-101', summary: 'Server rebooting randomly', currentStatus: 'New', createdAt: new Date().toISOString() },
            { id: 102, ticketNumber: 'TKT-102', summary: 'Need access to repo', currentStatus: 'In Progress', createdAt: new Date(Date.now() - 86400000).toISOString() },
          ]
        },
        status: 200
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await expect(page.locator('[data-testid="tickets-table"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-requester-a.png') });
  });

  test('my-tickets-requester-b-isolation.png', async ({ page }) => {
    // Login as Bob (id=2)
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '2');
      window.localStorage.setItem('dev_requester_name', 'Bob');
    });

    await page.route(/\/api\/tickets\?/, async route => {
      const url = route.request().url();
      if (url.includes('requesterId=2')) {
        await route.fulfill({
          json: {
            data: [
              { id: 201, ticketNumber: 'TKT-201', summary: 'Bob screen is flickering', currentStatus: 'New', createdAt: new Date().toISOString() }
            ]
          },
          status: 200
        });
      }
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await expect(page.locator('[data-testid="ticket-row-201"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-requester-b-isolation.png') });
  });

  test('my-tickets-search-filter-sort.png', async ({ page }) => {
    await page.route(/\/api\/tickets\?/, async route => {
      const url = route.request().url();
      if (url.includes('search=VPN') && url.includes('categoryId=2') && url.includes('sortBy=oldest')) {
        await route.fulfill({
          json: {
            data: [
              { id: 301, ticketNumber: 'TKT-301', summary: 'VPN is very slow', currentStatus: 'Resolved', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
            ]
          },
          status: 200
        });
      } else {
        await route.fulfill({
          json: {
            data: [
              { id: 101, ticketNumber: 'TKT-101', summary: 'Server rebooting randomly', currentStatus: 'New', createdAt: new Date().toISOString() },
              { id: 301, ticketNumber: 'TKT-301', summary: 'VPN is very slow', currentStatus: 'Resolved', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
            ]
          },
          status: 200
        });
      }
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    
    // Apply filters
    await page.locator('[data-testid="search-input"]').fill('VPN');
    await page.locator('[data-testid="category-filter"]').selectOption('2'); // Software category ID
    await page.locator('[data-testid="sort-filter"]').selectOption('oldest');
    
    await expect(page.locator('[data-testid="ticket-row-301"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-row-101"]')).not.toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-search-filter-sort.png') });
  });

  test('my-tickets-empty.png', async ({ page }) => {
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({ json: { data: [] }, status: 200 });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await expect(page.locator('[data-testid="empty-tickets"]')).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-empty.png') });
  });

  test('ticket-cross-access-blocked.png', async ({ page }) => {
    // Login as Bob (id=2), try to click Alice's ticket
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '2');
      window.localStorage.setItem('dev_requester_name', 'Bob');
    });

    await page.route(/\/api\/tickets\?/, async route => {
      // Mock the list API to show Alice's ticket anyway, just to simulate direct access
      await route.fulfill({
        json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Alice Ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] },
        status: 200
      });
    });

    await page.route(/\/api\/tickets\/1\?/, async route => {
      await route.fulfill({
        json: { error: 'Forbidden: You do not own this ticket' },
        status: 403
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    const viewBtn = page.locator('[data-testid="view-ticket-1"]');
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();
    
    await expect(page.locator('[data-testid="detail-error"]')).toContainText('Access denied');
    await page.screenshot({ path: path.join(screenshotsDir, 'ticket-cross-access-blocked.png') });
  });

  test('attachment-soft-remove.png', async ({ page }) => {
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({
        json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200
      });
    });
    
    await page.route(/\/api\/tickets\/1\?/, async route => {
      await route.fulfill({
        json: {
          id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Description',
          currentStatus: 'OPEN', requestedPriority: 'LOW',
          category: { id: 1, name: 'Hardware' }, relatedSystem: { id: 1, name: 'Laptop' },
          createdAt: new Date().toISOString(), attachments: [
            { id: 99, fileName: 'screenshot.png', fileSize: 10240, isRemoved: false }
          ]
        },
        status: 200
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="view-ticket-1"]').click();
    
    await expect(page.locator('[data-testid="attachment-item-99"]')).toBeVisible();
    await page.locator('[data-testid="remove-attach-99"]').click();
    
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('[data-testid="removal-reason-input"]').fill('Uploaded wrong file');
    
    await page.screenshot({ path: path.join(screenshotsDir, 'attachment-soft-remove.png') });
  });

  test('attachment-removed-metadata.png', async ({ page }) => {
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({
        json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200
      });
    });
    
    await page.route(/\/api\/tickets\/1\?/, async route => {
      await route.fulfill({
        json: {
          id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Description',
          currentStatus: 'OPEN', requestedPriority: 'LOW',
          category: { id: 1, name: 'Hardware' }, relatedSystem: { id: 1, name: 'Laptop' },
          createdAt: new Date().toISOString(), attachments: [
            { id: 99, fileName: 'screenshot.png', fileSize: 10240, isRemoved: true, removalReason: 'Uploaded wrong file' },
            { id: 100, fileName: 'log.txt', fileSize: 2048, isRemoved: false }
          ]
        },
        status: 200
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="view-ticket-1"]').click();
    
    await expect(page.locator('[data-testid="removed-badge-99"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-attach-99"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="download-attach-100"]')).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, 'attachment-removed-metadata.png') });
  });
});
