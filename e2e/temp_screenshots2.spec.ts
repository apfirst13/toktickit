import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Capture Lab 2 Screenshots Final', () => {
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
          { id: 1, name: 'Jennifer Anderson', email: 'jennifer@test.com' },
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
  });

  // 1. requester-selection.png
  test('requester-selection.png', async ({ page }) => {
    // Clear localStorage to ensure we are at requester selection
    await page.addInitScript(() => {
      window.localStorage.removeItem('dev_requester_id');
      window.localStorage.removeItem('dev_requester_name');
    });
    await page.goto('/');
    await expect(page.locator('select')).toBeVisible();
    await page.locator('select').selectOption('1');
    await expect(page.locator('button', { hasText: 'Continue' })).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'requester-selection.png') });
  });

  // 2. create-ticket-empty.png
  test('create-ticket-empty.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-summary"]')).toBeEmpty();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-empty.png') });
  });

  // 3. create-ticket-submitting.png
  test('create-ticket-submitting.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="input-summary"]').fill('Test summary');
    await page.locator('[data-testid="input-description"]').fill('Test description that is long enough');
    await page.locator('[data-testid="select-priority"]').selectOption('Low');
    
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

  // 4. create-ticket-api-error.png
  test('create-ticket-api-error.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="input-summary"]').fill('Test summary');
    await page.locator('[data-testid="input-description"]').fill('Test description that is long enough');
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
    await expect(page.locator('[data-testid="input-summary"]')).toHaveValue('Test summary');
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-api-error.png') });
  });

  // 5. create-ticket-success.png
  test('create-ticket-success.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.goto('/');
    await expect(page.locator('[data-testid="create-ticket-form"]')).toBeVisible();
    await page.locator('[data-testid="input-summary"]').fill('Test summary');
    await page.locator('[data-testid="input-description"]').fill('Test description that is long enough');
    await page.locator('[data-testid="select-priority"]').selectOption('Low');
    
    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { ticketNumber: 'TKT-9999' }, status: 201 });
      } else {
        await route.continue();
      }
    });
    
    await page.locator('[data-testid="submit-btn"]').click();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('TKT-9999');
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-success.png') });
  });

  // 6. create-ticket-invalid-file.png
  test('create-ticket-invalid-file.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
    });
    await page.route(/\/api\/tickets\/1\?/, async route => {
      await route.fulfill({
        json: {
          id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
          category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: []
        }, status: 200
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="view-ticket-1"]').click();
    
    await expect(page.locator('[data-testid="file-input"]')).toBeVisible();
    const invalidFile = Buffer.alloc(10);
    await page.locator('[data-testid="file-input"]').setInputFiles({ name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: invalidFile });
    
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'create-ticket-invalid-file.png') });
  });

  // 7. my-tickets-pagination.png
  test('my-tickets-pagination.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({
        json: {
          data: [
            { id: 1, ticketNumber: 'TKT-001', summary: 'Ticket 1', currentStatus: 'New', createdAt: new Date().toISOString() },
            { id: 2, ticketNumber: 'TKT-002', summary: 'Ticket 2', currentStatus: 'New', createdAt: new Date().toISOString() }
          ],
          meta: { totalPages: 5, page: 1, limit: 10, total: 50 }
        },
        status: 200
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-pagination.png') });
  });

  // 8. my-tickets-empty.png
  test('my-tickets-empty.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({ json: { data: [] }, status: 200 });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await expect(page.locator('[data-testid="empty-tickets"]')).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-empty.png') });
  });

  // 9. my-tickets-no-results.png
  test('my-tickets-no-results.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      const url = route.request().url();
      if (url.includes('search=')) {
        await route.fulfill({ json: { data: [] }, status: 200 });
      } else {
        await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Hello', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
      }
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="search-input"]').fill('Some completely random text');
    await expect(page.locator('[data-testid="empty-tickets"]')).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, 'my-tickets-no-results.png') });
  });

  // 10. cross-requester-blocked.png
  test('cross-requester-blocked.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '2');
      window.localStorage.setItem('dev_requester_name', 'Bob');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Alice Ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
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
    await page.screenshot({ path: path.join(screenshotsDir, 'cross-requester-blocked.png') });
  });

  // 11. attachment-add-success.png
  test('attachment-add-success.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
    });
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
    });
    
    let uploaded = false;
    await page.route(/\/api\/tickets\/1\?/, async route => {
      if (uploaded) {
        await route.fulfill({
          json: {
            id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
            category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: [
              { id: 99, fileName: 'screenshot.png', fileSize: 10240, isRemoved: false }
            ]
          }, status: 200
        });
      } else {
        await route.fulfill({
          json: {
            id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
            category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: []
          }, status: 200
        });
      }
    });

    await page.route(/\/api\/tickets\/1\/attachments/, async route => {
      uploaded = true;
      await route.fulfill({ json: { message: 'Success' }, status: 201 });
    });

    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="view-ticket-1"]').click();
    
    const validFile = Buffer.alloc(10);
    await page.locator('[data-testid="file-input"]').setInputFiles({ name: 'screenshot.png', mimeType: 'image/png', buffer: validFile });
    await page.locator('[data-testid="upload-btn"]').click();
    
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'attachment-add-success.png') });
  });

  // 12. attachment-unauthorized.png
  test('attachment-unauthorized.png', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '2');
      window.localStorage.setItem('dev_requester_name', 'Bob');
    });
    
    await page.route(/\/api\/tickets\/1\/attachments\/99\/download/, async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden: You do not own this ticket' })
      });
    });

    await page.goto('/api/tickets/1/attachments/99/download?requesterId=2');
    await expect(page.locator('body')).toContainText('Forbidden');
    await page.screenshot({ path: path.join(screenshotsDir, 'attachment-unauthorized.png') });
  });
});
