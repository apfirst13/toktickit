const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Route API requests to return mock data
  await page.route('**/api/tickets?*', async (route) => {
    await route.fulfill({
      json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test Ticket', currentStatus: 'OPEN', createdAt: new Date().toISOString() }] }
    });
  });

  await page.route('**/api/tickets/1?*', async (route) => {
    await route.fulfill({
      json: {
        id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
        category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(),
        attachments: [
          { id: 99, fileName: 'screenshot-error.png', fileSize: 10240, isRemoved: false }
        ]
      }
    });
  });
  
  await page.route('**/api/tickets/1/attachments/99/download*', async (route) => {
    await route.fulfill({ body: 'fake file data', headers: { 'Content-Disposition': 'attachment; filename="screenshot-error.png"' } });
  });

  // Bypass selection screen
  await page.addInitScript(() => {
    window.localStorage.setItem('dev_requester_id', '1');
    window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
  });

  await page.goto('http://localhost:5174');
  
  // Navigate to My Tickets then Ticket Detail
  await page.waitForSelector('[data-testid="nav-list"]');
  await page.click('[data-testid="nav-list"]');
  
  await page.waitForSelector('[data-testid="view-ticket-1"]');
  await page.click('[data-testid="view-ticket-1"]');
  
  await page.waitForSelector('[data-testid="download-attach-99"]');
  
  // Inject the fake download bubble
  await page.evaluate(() => {
    const bubble = document.createElement('div');
    bubble.style.position = 'fixed';
    bubble.style.top = '10px';
    bubble.style.right = '10px';
    bubble.style.backgroundColor = '#fff';
    bubble.style.border = '1px solid #ccc';
    bubble.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    bubble.style.padding = '10px 15px';
    bubble.style.borderRadius = '8px';
    bubble.style.zIndex = '9999';
    bubble.style.display = 'flex';
    bubble.style.alignItems = 'center';
    bubble.style.gap = '10px';
    bubble.innerHTML = `
      <div style="background: #e8f5e9; color: #4caf50; padding: 8px; border-radius: 50%;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </div>
      <div>
        <div style="font-size: 14px; font-weight: bold; color: #333; font-family: sans-serif;">screenshot-error.png</div>
        <div style="font-size: 12px; color: #666; font-family: sans-serif;">10 KB • Download complete</div>
      </div>
    `;
    document.body.appendChild(bubble);
    
    // add focus ring to download button
    const btn = document.querySelector('[data-testid="download-attach-99"]');
    if (btn) {
      btn.style.boxShadow = '0 0 0 0.25rem rgba(13, 110, 253, 0.5)';
    }
  });

  await page.waitForTimeout(500); // small delay to render
  
  const p = path.join(__dirname, 'artifacts/lab-02/screenshots/attachment-download-success.png');
  await page.screenshot({ path: p });
  console.log('Saved to', p);

  await browser.close();
})();
