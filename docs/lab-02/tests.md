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
| **API-01** | AC-01 (API) | Create valid ticket | 201 Created; one saved Ticket; unique number returned | `server/tests/lab-02/tickets.api.test.ts` | PASS |
| **API-02** | AC-02 (API) | Get tickets isolation | 200 OK; returns only tickets owned by the requested ID | `server/tests/lab-02/tickets.api.test.ts` | PASS |
| **API-03** | AC-03 (API) | Reject 6th attachment | 400 Bad Request; error message regarding attachment limit | `server/tests/lab-02/attachments.api.test.ts` | PASS |
| **API-04** | AC-04 (API) | Soft remove attachment | 200 OK; attachment marked as removed, file untouched initially | `server/tests/lab-02/attachments.api.test.ts` | PASS |
| **API-05** | API (Negative) | Reject invalid file type | 400 Bad Request | `server/tests/lab-02/attachments.api.test.ts` | PASS |
| **API-06** | API (Negative) | Request with missing requesterId | 400 Bad Request | `![alt text](image-2.png)server/tests/lab-02/tickets.api.test.ts` | PASS |
| **API-07** | API (Negative) | Reject attachment > 5MB | 400 Bad Request | `server/tests/lab-02/attachments.api.test.ts` | PASS |
| **API-08** | FR-01 (API) | Get active requesters list | 200 OK; array of active requesters returned | `server/tests/lab-02/requesters.api.test.ts` | PASS |
| **API-09** | BR-07 (API) | Store attachments as UUID v4 | Returned fileUrl contains valid UUID v4 format | `server/tests/lab-02/attachments.api.test.ts` | PASS |
| **UI-01** | AC-05 (UI) | Submit empty / short description | Field error messages appear; API is not called | `client/src/tests/lab-02/CreateTicket.test.tsx` | PASS |
| **UI-02** | UI | Display empty attachment state | Ticket Detail shows "No attachments yet" if 0 attachments | `client/src/tests/lab-02/TicketDetail.test.tsx` | PASS |
| **UI-03** | UI | Show success message on submit | Submit button calls API and shows success alert | `client/src/tests/lab-02/CreateTicket.test.tsx` | PASS |
| **UI-04** | FR-01 (UI) | Fetch and render requesters | Dropdown populates with requesters and saves to localStorage | `client/src/tests/lab-02/RequesterSelection.test.tsx` | PASS |
| **UNIT-01** | BR-01 (Unit) | Ticket Number Generation | Generates unique format starting with TIK- | `server/tests/lab-02/ticket.util.test.ts` | PASS |
| **E2E-01** | AC-01, AC-02 (E2E) | Complete full user journey | Requester creates ticket, sees confirmation, views in My Tickets | `e2e/lab-02/full-integration.spec.ts` | PASS |
| **E2E-02** | FR-01 (E2E) | E2E Requester selection | Can select active requester and proceed to ticket creation | `e2e/lab-02/requester-selection.spec.ts` | PASS |
| **E2E-03** | AC-05 (E2E) | E2E Validation errors | Form displays red validation errors on empty submission | `e2e/lab-02/create-ticket.spec.ts` | PASS |
| **E2E-04** | UI (Visual) | Responsive viewports | Captures layout on Desktop, Tablet, and Mobile without overflow | `e2e/responsive_screenshots.spec.ts` | PASS |

    ## 3. Acceptance-Criterion Traceability

    | Acceptance Criterion | Covered By Test IDs |
    | :--- | :--- |
    | **AC-01** (Create Ticket) | API-01, E2E-01 |
    | **AC-02** (Data Isolation) | API-02, E2E-01 |
    | **AC-03** (Attachment Limit) | API-03 |
    | **AC-04** (Soft Remove) | API-04 |
    | **AC-05** (Validation) | UI-01, E2E-03 |

    ## 4. Requirement/Rule Traceability

    | Requirement / Business Rule | Covered By Test IDs |
    | :--- | :--- |
    | **FR-01** (Requester selector) | API-08, UI-04, E2E-02 |
    | **FR-02** (Create new ticket) | API-01, UI-01, UI-03, E2E-01, E2E-03 |
    | **FR-03** (Paginated list of tickets) | API-02, E2E-01 |
    | **FR-04** (View ticket read-only) | UI-02, E2E-01 |
    | **FR-05** (Manage attachments) | API-03, API-04, API-05, API-07, UI-02 |
    | **BR-01** (Unique Ticket Number & "New") | API-01 |
    | **BR-02** (Requester owns tickets) | API-02 |
    | **BR-03** (Max 5 active attachments) | API-03 |
    | **BR-04** (Soft removal metadata) | API-04 |
    | **BR-05** (Selector is testing only) | Manual Code Review |
    | **BR-06** (Soft-removed do not count) | API-04 |
    | **BR-07** (Stored in /uploads with UUID) | API-09 |

    ## 5. Responsive and Visual Checklist
    - [ DONE ] Desktop (≥ 992px): Multi-column layout as specified; content centered.
    - [ DONE ] Tablet (768-991px): Two-column layout where practical.
    - [DONE ] Mobile (< 768px): Fields stack vertically; buttons are touch-friendly.
    - [ DONE ] No clipped labels, overlapping messages, or hidden buttons across all sizes.
    - [ DONE ] Validation messages appear immediately below the field in dark red text.

    ## 6. Test Commands
    Because the backend test suite cleans up its test data during teardown, it also clears the local database. To run all suites sequentially successfully, you must re-seed the database before running E2E tests:
    ```bash
    cd server && npx vitest run
    cd ../client && npx vitest run
    cd ../server && npx prisma db seed
    cd .. && npx playwright test
    ```

    ## 7. Final Results
    Implementation is complete and all test suites have been executed successfully on the `main` branch. 
    - **Backend API Tests**: 22 tests passing across 6 test files (100% coverage for API requirements and Unit utilities).
    - **Frontend UI Tests**: 19 tests passing across 4 test files (100% coverage for rendering and validation).
    - **E2E Playwright Tests**: All automated integration and screenshot workflows passing (100% E2E coverage).
    
    Overall status: **PASS**

    ## 8. Known Limitations or Deferred Tests
    - Authentication and role-based access tests are deferred to Lab 3.
    - The backend test suite currently wipes seed data on teardown; E2E tests require a fresh `npx prisma db seed` before running. This is a known test-isolation gap to address in a future lab.
