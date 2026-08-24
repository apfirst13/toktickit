# Lab 2 Test Plan and Results

## 1. Test Strategy
We will employ a Spec-Driven and Test-Driven Development (TDD) approach. The testing strategy includes:
- **API Tests (Supertest):** To verify endpoint contracts, ownership rules, validation, and attachment limits.
- **UI Tests (Vitest):** To verify component rendering, form validation states, and API error handling.
- **E2E Tests (Playwright):** To ensure the critical user flows (select requester, create ticket, view ticket) work seamlessly across the full stack.
- **Visual & Responsive Checks:** Manual and automated checks for Desktop, Tablet, and Mobile viewports against the Zen Green Theme.

## 2. Planned Tests

| Test ID | Requirement/Type | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | AC-01 (API) | Create valid ticket | 201 Created; one saved Ticket; unique number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| **API-02** | AC-02 (API) | Get tickets isolation | 200 OK; returns only tickets owned by the requested ID | `server/tests/lab-02/my-tickets.api.test.ts` | Pending |
| **API-03** | AC-03 (API) | Reject 6th attachment | 400 Bad Request; error message regarding attachment limit | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| **API-04** | AC-04 (API) | Soft remove attachment | 200 OK; attachment marked as removed, file untouched initially | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| **UI-01** | AC-05 (UI) | Submit without Summary | Field error message appears; API is not called | `client/tests/lab-02/CreateTicket.test.tsx` | Pending |
| **UI-02** | UI | Display empty state | My Tickets shows a friendly empty state if 0 tickets exist | `client/tests/lab-02/MyTickets.test.tsx` | Pending |
| **UI-03** | UI | Loading state on submit | Submit button shows busy state while API is pending | `client/tests/lab-02/CreateTicket.test.tsx` | Pending |
| **E2E-01** | AC-01, AC-02 (E2E) | Complete responsive flow | Requester creates ticket, sees confirmation, finds it in My Tickets | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |

## 3. Acceptance-Criterion Traceability

| Acceptance Criterion | Covered By Test IDs |
| :--- | :--- |
| **AC-01** (Create Ticket) | API-01, E2E-01 |
| **AC-02** (Data Isolation) | API-02, E2E-01 |
| **AC-03** (Attachment Limit) | API-03 |
| **AC-04** (Soft Remove) | API-04 |
| **AC-05** (Validation) | UI-01 |

## 4. Responsive and Visual Checklist
- [ ] Desktop (≥ 992px): Multi-column layout as specified; content centered.
- [ ] Tablet (768-991px): Two-column layout where practical.
- [ ] Mobile (< 768px): Fields stack vertically; buttons are touch-friendly.
- [ ] No clipped labels, overlapping messages, or hidden buttons across all sizes.
- [ ] Validation messages appear immediately below the field in dark red text.

## 5. Test Commands
- **Backend API Tests:** `cd server && npx vitest run`
- **Frontend UI Tests:** `cd client && npx vitest run`
- **E2E Tests:** `npx playwright test`

## 6. Final Results
*(To be updated with "PASS" once implementation is complete and tests are running successfully)*

## 7. Known Limitations or Deferred Tests
- Authentication and role-based access tests are deferred to Lab 3.