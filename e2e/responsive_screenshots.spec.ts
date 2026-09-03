import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Responsive Viewport Screenshots', () => {
  const screenshotsDir = path.join(__dirname, '../artifacts/lab-02/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/requesters', async route => {
      await route.fulfill({
        json: [{ id: 1, name: 'Alice', email: 'alice@test.com' }]
      });
    });
    
    await page.addInitScript(() => {
      window.localStorage.setItem('dev_requester_id', '1');
      window.localStorage.setItem('dev_requester_name', 'Alice');
    });

    // Mock List
    await page.route(/\/api\/tickets\?/, async route => {
      await route.fulfill({
        json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200
      });
    });

    // Mock Detail
    await page.route(/\/api\/tickets\/1\?/, async route => {
      await route.fulfill({
        json: {
          id: 1, ticketNumber: 'TKT-001', summary: 'Responsive UI Test Ticket', 
          description: 'This ticket tests the responsive layout of the Ticket Detail screen. It should stack cleanly on mobile and flow smoothly on tablet devices without introducing horizontal scrolling.',
          currentStatus: 'OPEN', requestedPriority: 'HIGH',
          category: { id: 1, name: 'Hardware' }, relatedSystem: { id: 1, name: 'Laptop' },
          createdAt: new Date().toISOString(), 
          attachments: [
            { id: 1, fileName: 'screenshot-error-log-long-file-name-test.png', fileSize: 10240, isRemoved: false },
            { id: 2, fileName: 'notes.txt', fileSize: 2048, isRemoved: true, removalReason: 'Wrong file' }
          ]
        },
        status: 200
      });
    });
  });

  const navigateToDetail = async (page: any) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-list"]').click();
    await page.locator('[data-testid="view-ticket-1"]').click();
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();
  };

  test('responsive-desktop.png', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await navigateToDetail(page);
    
    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, 'responsive-desktop.png'), fullPage: true });
  });

  test('responsive-tablet.png', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1024 });
    await navigateToDetail(page);

    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, 'responsive-tablet.png'), fullPage: true });
  });

  test('responsive-mobile.png', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToDetail(page);

    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, 'responsive-mobile.png'), fullPage: true });
  });
});
