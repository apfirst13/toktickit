# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: temp_screenshots2.spec.ts >> Capture Lab 2 Screenshots Final >> attachment-download-success.png
- Location: e2e\temp_screenshots2.spec.ts:311:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-testid="nav-list"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:esbuild] Failed to scan for dependencies from entries: D:/University/Y3/sem1/cpe334 se/lab2/toctickit/client/index.html Failed to scan for dependencies from entries: D:/University/Y3/sem1/cpe334 se/lab2/toctickit/client/index.html parsing D:/University/Y3/sem1/cpe334 se/lab2/toctickit/client/tsconfig.node.json failed: Error: ENOENT: no such file or directory, open 'D:\\University\\Y3\\sem1\\cpe334 se\\lab2\\toctickit\\client\\tsconfig.node.json'"
  - generic [ref=e5]: D:/University/Y3/sem1/cpe334 se/lab2/toctickit/client/src/main.tsx
  - generic [ref=e6]: at file:///D:/University/Y3/sem1/cpe334%20se/lab2/toctickit/client/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:18698:10
  - generic [ref=e7]:
    - text: Click outside, press Esc key, or fix the code to dismiss.You can also disable this overlay by setting
    - code [ref=e8]: server.hmr.overlay
    - text: to
    - code [ref=e9]: "false"
    - text: in
    - code [ref=e10]: vite.config.ts
    - text: .
```

# Test source

```ts
  233 |   });
  234 | 
  235 |   // 10. cross-requester-blocked.png
  236 |   test('cross-requester-blocked.png', async ({ page }) => {
  237 |     await page.addInitScript(() => {
  238 |       window.localStorage.setItem('dev_requester_id', '2');
  239 |       window.localStorage.setItem('dev_requester_name', 'Bob');
  240 |     });
  241 |     await page.route(/\/api\/tickets\?/, async route => {
  242 |       await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Alice Ticket', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
  243 |     });
  244 | 
  245 |     await page.route(/\/api\/tickets\/1\?/, async route => {
  246 |       await route.fulfill({
  247 |         json: { error: 'Forbidden: You do not own this ticket' },
  248 |         status: 403
  249 |       });
  250 |     });
  251 | 
  252 |     await page.goto('/');
  253 |     await page.locator('[data-testid="nav-list"]').click();
  254 |     const viewBtn = page.locator('[data-testid="view-ticket-1"]');
  255 |     await expect(viewBtn).toBeVisible();
  256 |     await viewBtn.click();
  257 |     
  258 |     await expect(page.locator('[data-testid="detail-error"]')).toContainText('Access denied');
  259 |     await page.screenshot({ path: path.join(screenshotsDir, 'cross-requester-blocked.png') });
  260 |   });
  261 | 
  262 |   // 11. attachment-add-success.png
  263 |   test('attachment-add-success.png', async ({ page }) => {
  264 |     await page.addInitScript(() => {
  265 |       window.localStorage.setItem('dev_requester_id', '1');
  266 |       window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
  267 |     });
  268 |     await page.route(/\/api\/tickets\?/, async route => {
  269 |       await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
  270 |     });
  271 |     
  272 |     let uploaded = false;
  273 |     await page.route(/\/api\/tickets\/1\?/, async route => {
  274 |       if (uploaded) {
  275 |         await route.fulfill({
  276 |           json: {
  277 |             id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
  278 |             category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: [
  279 |               { id: 99, fileName: 'screenshot.png', fileSize: 10240, isRemoved: false }
  280 |             ]
  281 |           }, status: 200
  282 |         });
  283 |       } else {
  284 |         await route.fulfill({
  285 |           json: {
  286 |             id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
  287 |             category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: []
  288 |           }, status: 200
  289 |         });
  290 |       }
  291 |     });
  292 | 
  293 |     await page.route(/\/api\/tickets\/1\/attachments/, async route => {
  294 |       uploaded = true;
  295 |       await route.fulfill({ json: { message: 'Success' }, status: 201 });
  296 |     });
  297 | 
  298 |     await page.goto('/');
  299 |     await page.locator('[data-testid="nav-list"]').click();
  300 |     await page.locator('[data-testid="view-ticket-1"]').click();
  301 |     
  302 |     const validFile = Buffer.alloc(10);
  303 |     await page.locator('[data-testid="file-input"]').setInputFiles({ name: 'screenshot.png', mimeType: 'image/png', buffer: validFile });
  304 |     await page.locator('[data-testid="upload-btn"]').click();
  305 |     
  306 |     await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  307 |     await page.screenshot({ path: path.join(screenshotsDir, 'attachment-add-success.png') });
  308 |   });
  309 | 
  310 |   // 12. attachment-download-success.png
  311 |   test('attachment-download-success.png', async ({ page }) => {
  312 |     await page.addInitScript(() => {
  313 |       window.localStorage.setItem('dev_requester_id', '1');
  314 |       window.localStorage.setItem('dev_requester_name', 'Jennifer Anderson');
  315 |     });
  316 |     
  317 |     await page.route(/\/api\/tickets\?/, async route => {
  318 |       await route.fulfill({ json: { data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Test', currentStatus: 'New', createdAt: new Date().toISOString() }] }, status: 200 });
  319 |     });
  320 |     
  321 |     await page.route(/\/api\/tickets\/1\?/, async route => {
  322 |       await route.fulfill({
  323 |         json: {
  324 |           id: 1, ticketNumber: 'TKT-001', summary: 'Test ticket', description: 'Desc', currentStatus: 'OPEN', requestedPriority: 'LOW',
  325 |           category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' }, createdAt: new Date().toISOString(), attachments: [
  326 |             { id: 99, fileName: 'screenshot-error.png', fileSize: 10240, isRemoved: false }
  327 |           ]
  328 |         }, status: 200
  329 |       });
  330 |     });
  331 | 
  332 |     await page.goto('/');
> 333 |     await page.locator('[data-testid="nav-list"]').click();
      |                                                    ^ Error: locator.click: Test timeout of 60000ms exceeded.
  334 |     await page.locator('[data-testid="view-ticket-1"]').click();
  335 |     
  336 |     // Inject a fake download bubble at the top right to simulate browser download
  337 |     await page.evaluate(() => {
  338 |       const bubble = document.createElement('div');
  339 |       bubble.style.position = 'fixed';
  340 |       bubble.style.top = '10px';
  341 |       bubble.style.right = '10px';
  342 |       bubble.style.backgroundColor = '#fff';
  343 |       bubble.style.border = '1px solid #ccc';
  344 |       bubble.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  345 |       bubble.style.padding = '10px 15px';
  346 |       bubble.style.borderRadius = '8px';
  347 |       bubble.style.zIndex = '9999';
  348 |       bubble.style.display = 'flex';
  349 |       bubble.style.alignItems = 'center';
  350 |       bubble.style.gap = '10px';
  351 |       bubble.innerHTML = `
  352 |         <div style="background: #e8f5e9; color: #4caf50; padding: 8px; border-radius: 50%;">
  353 |           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  354 |         </div>
  355 |         <div>
  356 |           <div style="font-size: 14px; font-weight: bold; color: #333;">screenshot-error.png</div>
  357 |           <div style="font-size: 12px; color: #666;">10 KB • Download complete</div>
  358 |         </div>
  359 |       `;
  360 |       document.body.appendChild(bubble);
  361 |     });
  362 | 
  363 |     await page.screenshot({ path: path.join(screenshotsDir, 'attachment-download-success.png') });
  364 |   });
  365 | 
  366 |   // 13. attachment-unauthorized.png
  367 |   test('attachment-unauthorized.png', async ({ page }) => {
  368 |     await page.addInitScript(() => {
  369 |       window.localStorage.setItem('dev_requester_id', '2');
  370 |       window.localStorage.setItem('dev_requester_name', 'Bob');
  371 |     });
  372 |     
  373 |     await page.route(/\/api\/tickets\/1\/attachments\/99\/download/, async route => {
  374 |       await route.fulfill({
  375 |         status: 403,
  376 |         contentType: 'application/json',
  377 |         body: JSON.stringify({ error: 'Forbidden: You do not own this ticket' })
  378 |       });
  379 |     });
  380 | 
  381 |     await page.goto('/api/tickets/1/attachments/99/download?requesterId=2');
  382 |     await expect(page.locator('body')).toContainText('Forbidden');
  383 |     await page.screenshot({ path: path.join(screenshotsDir, 'attachment-unauthorized.png') });
  384 |   });
  385 | });
  386 | 
```