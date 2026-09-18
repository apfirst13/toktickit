import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

async function loginAs(page: Page, request: any, email: string) {
  const res = await request.post('/api/auth/login', {
    data: { email, password: 'Password123!' }
  });
  const data = await res.json();
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, data.token);
}

test.describe('Visual Inspection and Screenshots (VIS-01)', () => {

  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`Capture Auth Security Alert - ${vp.name}`, async ({ page, request }) => {
        // Create a user that needs password change
        const adminRes = await request.post('/api/auth/login', {
          data: { email: 'admin@toktickit.com', password: 'Password123!' }
        });
        const adminData = await adminRes.json();
        const uniqueEmail = `vis_auth_${vp.name}_${Date.now()}@toktickit.com`;
        await request.post('/api/admin/users', {
          headers: { Authorization: `Bearer ${adminData.token}` },
          data: { email: uniqueEmail, fullName: 'Visual Test', role: 'REQUESTER', initialPassword: 'Password123!' }
        });

        // Login as new user
        const loginRes = await request.post('/api/auth/login', {
          data: { email: uniqueEmail, password: 'Password123!' }
        });
        const userData = await loginRes.json();
        
        await page.goto('/');
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, userData.token);
        await page.reload();

        await expect(page.getByTestId('must-change-password-alert')).toBeVisible();
        await page.waitForTimeout(500); // allow styles to settle
        await page.screenshot({ path: `artifacts/lab-03/screenshots/${vp.name}-01-auth-alert.png`, fullPage: true });
      });

      test(`Capture Staff Queue - ${vp.name}`, async ({ page, request }) => {
        await loginAs(page, request, 'staff1@toktickit.com');
        await page.goto('/');
        await page.click('[data-testid="nav-staff-queue"]');
        await expect(page.locator('text=IT Staff Ticket Queue')).toBeVisible();
        
        await page.waitForTimeout(500);
        await page.screenshot({ path: `artifacts/lab-03/screenshots/${vp.name}-02-staff-queue.png`, fullPage: true });
      });

      test(`Capture Staff Detail - ${vp.name}`, async ({ page, request }) => {
        await loginAs(page, request, 'staff1@toktickit.com');
        await page.goto('/');
        await page.click('[data-testid="nav-staff-queue"]');
        
        if (vp.name === 'mobile' || vp.name === 'tablet') {
          // In mobile/tablet, click the View button in the card
          const firstViewButton = page.locator('.d-lg-none button:has-text("View")').first();
          await expect(firstViewButton).toBeVisible();
          await firstViewButton.click();
        } else {
          // In desktop, click the View button in the table
          const firstRowViewButton = page.locator('table tbody tr').first().locator('button:has-text("View")');
          await expect(firstRowViewButton).toBeVisible();
          await firstRowViewButton.click();
        }

        await expect(page.getByTestId('detail-number')).toBeVisible();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `artifacts/lab-03/screenshots/${vp.name}-03-staff-detail.png`, fullPage: true });
      });

      test(`Capture Admin User Management - ${vp.name}`, async ({ page, request }) => {
        await loginAs(page, request, 'admin@toktickit.com');
        await page.goto('/');
        await page.click('[data-testid="nav-users"]');
        await expect(page.locator('text=User Management')).toBeVisible();
        
        await page.waitForTimeout(500);
        await page.screenshot({ path: `artifacts/lab-03/screenshots/${vp.name}-04-admin-users.png`, fullPage: true });
      });
    });
  }
});
