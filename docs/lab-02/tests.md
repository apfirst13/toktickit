# Lab 2 Test Plan and Results

## 1. Test Strategy
We will employ a Spec-Driven and Test-Driven Development (TDD) approach. The testing strategy includes:
- **API Tests (Vitest/Supertest):** To verify endpoint contracts, ownership rules, validation, and attachment limits.
- **UI Tests (Vitest/React Testing Library):** To verify component rendering, form validation states, and API error handling.
- **E2E Tests (Playwright):** To ensure the critical user flows work seamlessly across the full stack.
- **Visual & Responsive Checks:** Manual and automated checks for Desktop, Tablet, and Mobile viewports against the Zen Green Theme.

## 2. Planned Tests

| Test ID | Requirement | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | AC-01 | Create valid ticket | 201 Created; saved Ticket; unique number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| **API-02** | AC-02 | Get tickets isolation | 200 OK; returns only tickets owned by the requester | `server/tests/lab-02/my-tickets.api.test.ts` | Pending |
| **API-03** | AC-03 | Reject 6th attachment | 400 Bad Request; error message about limit | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| **API-04** | AC-04 | Soft remove attachment| 200 OK; marked as removed, file untouched initially | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| **UI-01** | AC-05 | Submit without Summary| Field error message appears; API is not called | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pending |
| **UI-02** | UI | Display empty state | My Tickets shows a friendly empty state if 0 tickets | `client/src/tests/lab-02/MyTickets.test.tsx` | Pending |
| **E2E-01** | AC-01, AC-02| Complete flow | Requester creates ticket, sees it in My Tickets | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |

## 3. Acceptance-Criterion Traceability
- **AC-01** (Create Ticket) -> API-01, E2E-01
- **AC-02** (Data Isolation) -> API-02, E2E-01
- **AC-03** (Attachment Limit) -> API-03
- **AC-04** (Soft Remove) -> API-04
- **AC-05** (Validation) -> UI-01

## 4. Responsive and Visual Checklist
- [ ] **Desktop (≥ 992px):** Multi-column layout; content centered with sensible max width.
- [ ] **Tablet (768 - 991px):** Two-column layout where practical.
- [ ] **Mobile (< 768px):** Fields stack vertically; touch-friendly buttons; no horizontal scroll.

## 5. Test Commands
- **Backend:** `cd server && npx vitest run`
- **Frontend:** `cd client && npx vitest run`
- **E2E:** `npx playwright test`