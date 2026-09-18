import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Capture Part 7: Ticket Detail UI Screenshots', () => {

  test.beforeAll(async () => {
    // Create a dummy image file to upload as attachment
    const dummyFilePath = path.join(__dirname, 'dummy-error.png');
    if (!fs.existsSync(dummyFilePath)) {
      fs.writeFileSync(dummyFilePath, 'dummy content');
    }
  });

  test('Capture Detail Actions and Attachments', async ({ page }) => {
    // 1. Log in as Requester to CREATE a ticket and upload an attachment
    await page.goto('/');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('button:has-text("Logout")');
    
    const passwordAlert = await page.locator('[data-testid="must-change-password-alert"]').count();
    if (passwordAlert > 0) {
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Change Password")');
    }
    
    // Create ticket on dashboard
    await page.fill('input[placeholder="Brief summary of the issue (max 200 chars)"]', 'Login issue');
    await page.fill('textarea[placeholder="Describe the issue in detail (min 20 chars)"]', 'I cannot login to the email system since morning.');
    await page.selectOption('select[data-testid="select-category"]', 'Account and Access');
    await page.selectOption('select[data-testid="select-system"]', 'Email');
    await page.selectOption('select[data-testid="select-priority"]', 'High');
    await page.click('button:has-text("Submit Ticket")');
    
    await page.waitForSelector('[data-testid="success-message"]');

    // Now go to My Tickets and view it
    await page.click('button:has-text("My Tickets")');
    await page.waitForSelector('text=My Tickets');

    const viewBtn = page.locator('button:has-text("View")').first();
    await viewBtn.click();
    await page.waitForSelector('[data-testid="detail-number"]');
    
    // Upload attachment
    await page.setInputFiles('input[type="file"]', path.join(__dirname, 'dummy-error.png'));
    await page.click('button:has-text("Upload Attachment")');
    await page.waitForSelector('text=dummy-error.png'); // Wait for upload

    // 2. Log out, log in as Staff2 to claim and capture
    await page.click('button:has-text("Logout")');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'staff2@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('button:has-text("Logout")');
    const staffPasswordAlert = await page.locator('[data-testid="must-change-password-alert"]').count();
    if (staffPasswordAlert > 0) {
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Change Password")');
    }

    await page.click('button:has-text("Staff Queue")');
    await page.waitForSelector('text=IT Staff Ticket Queue');
    
    // Claim ticket
    await page.locator('button:has-text("View")').first().click();
    await page.waitForSelector('select[data-testid="assign-select"]');
    await page.selectOption('select[data-testid="assign-select"]', { label: 'IT Sarah' });
    await page.click('[data-testid="save-meta-btn"]');
    await page.waitForTimeout(1000); 

    // Capture Claim/Reassign ownership (which includes Attachment UI!)
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/desktop-03-staff-detail.png' });
    
    // Priority changes
    await page.selectOption('select[data-testid="itpriority-select"]', 'HIGH');
    await page.waitForTimeout(500);
    await page.locator('select[data-testid="itpriority-select"]').click();
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-priority-change.png' });
    await page.locator('body').click();
    
    // Status changes
    await page.locator('select[data-testid="status-select"]').click();
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-status-change.png' });
    await page.locator('body').click();

    // Public Comment
    await page.fill('textarea[placeholder="Add a public comment..."]', 'We are looking into this issue.');
    await page.click('button:has-text("Post Comment")');
    await page.waitForSelector('text=We are looking into this issue.');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-public-comment.png' });

    // Internal Note
    await page.fill('textarea[placeholder="Add an internal note..."]', 'System shows high CPU usage.');
    await page.click('button:has-text("Save Internal Note")');
    await page.waitForSelector('text=System shows high CPU usage.');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-internal-note.png' });
  });

  
  test('Capture Requester Resolution Indication', async ({ page }) => {
    // Log in as Requester
    await page.goto('/');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('button:has-text("Logout")');
    await page.click('button:has-text("My Tickets")');
    await page.waitForSelector('text=My Tickets');
    
    await page.locator('button:has-text("View")').first().click();
    
    // Wait for the button
    await page.waitForSelector('button:has-text("Problem Appears Resolved")');
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-requester-resolved.png' });
  });
test('Capture Role Restriction', async ({ page }) => {
    // Log in as Staff1 and try to view a ticket owned by Staff2
    await page.goto('/');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('button:has-text("Logout")');
    const staffPasswordAlert = await page.locator('[data-testid="must-change-password-alert"]').count();
    if (staffPasswordAlert > 0) {
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Change Password")');
    }

    await page.click('button:has-text("Staff Queue")');
    await page.waitForSelector('text=IT Staff Ticket Queue');
    
    await page.locator('button:has-text("View")').first().click();
    await page.waitForSelector('text=Status'); 
    
    // Status/Priority should be disabled
    await page.screenshot({ path: 'artifacts/lab-03/screenshots/detail-role-restriction.png' });
  });
});
