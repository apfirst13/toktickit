# Lab 4 - Test Specification & Traceability

This document defines the comprehensive test strategy and execution results for TokTickIT Lab 4, ensuring all Functional Requirements (FR), Business Rules (BR), and Acceptance Criteria (AC) from `specification.md` are verified and passing on `main`.

---

## 1. Test Strategy Overview

The testing approach relies on layered automation covering 3 primary levels:
1. **API / Integration Tests (Vitest):** Tests backend REST endpoints, DTO validation, Prisma transactions, optimistic locking (409 Conflict), and Resolution Gate constraints.
2. **UI Component Tests (Vitest + Testing Library):** Tests React component rendering, form validation, edit modes, role visibility guards, timezone formatting, and keyboard accessibility.
3. **End-to-End Tests (Playwright):** Browser-level tests simulating user interactions, rapid double-click submissions (`isSubmittingRef`), requester data isolation, and stale status update workflows.

---

## 2. Test Execution Summary on `main` Branch

All tests have been executed and verified directly on the `main` branch following Sprint 4 merges (PR #84, #85, #87, #88):

| Test Suite | Total Files | Lab 4 Files | Tests Passed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Server Tests (Vitest)** | 17 passed (17) | 6 files | 82 / 82 passed (Lab 4: 26, Regression: 56) | <span style="color:#065f46;font-weight:bold;">PASS (100%)</span> |
| **Client Tests (Vitest)** | 12 passed (12) | 4 files | 67 / 67 passed (Lab 4: 26, Regression: 41) | <span style="color:#065f46;font-weight:bold;">PASS (100%)</span> |
| **E2E Tests (Playwright)** | 4 passed (4) | 4 files | 10 / 10 passed | <span style="color:#065f46;font-weight:bold;">PASS (100%)</span> |
| **Total Test Execution** | **33 passed (33)** | **14 files** | **159 / 159 passed** | <span style="color:#065f46;font-weight:bold;">PASS (100%)</span> |

---

## 3. Test Specification & Traceability Matrix

| Test ID | Layer | Requirement | AC Mapping | Scenario / Description | Automated Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Actions Taken API** | | | | | | |
| API-01 | API | FR-02, BR-02 | AC-01 | Allow POST Action Taken from IT Staff / Admin (201 Created) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-02 | API | FR-04, BR-02 | AC-02 | Reject POST if followUpRequired is true but followUpNote is empty (400 Bad Request) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-03 | API | Authz | AC-01 | Reject POST Action Taken from Requester (403 Forbidden) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-04 | API | FR-03, BR-03 | AC-03 | Allow PATCH Action Taken if version matches expected version (200 OK) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-05 | API | BR-03 | AC-03 | Reject PATCH Action Taken if version is stale / concurrent edit (409 Conflict) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-06 | API | FR-01 | AC-01 | GET Actions Taken list ordered by actionDateTime ascending | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| API-07 | API | Authz | AC-14 | Reject assigning ticket to inactive staff member (400 Bad Request) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **Ticket Workflow API** | | | | | | |
| WF-01 | API | BR-01 | AC-04 | Resolution Gate: Allow transition to RESOLVED if ticket has at least one Action Taken | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| WF-02 | API | BR-01 | AC-04 | Resolution Gate: Reject transition to RESOLVED if ticket has 0 Actions Taken (400) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| WF-03 | API | BR-10 | AC-03 | Reject ticket status update with 409 Conflict if expectedStatus does not match DB | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| WF-04 | API | BR-01 | AC-04 | Enforce strict status transition matrix (ALLOWED_TRANSITIONS) on all states | `server/tests/lab-04/ticket-workflow.api.test.ts` | **PASS** |
| **Dashboards API** | | | | | | |
| RD-01 | API | FR-05, Authz | AC-05 | Return requester dashboard metrics scoped strictly to req.user.id | `server/tests/lab-04/requester-dashboard.api.test.ts` | **PASS** |
| RD-02 | API | FR-05, Authz | AC-05 | Requester cannot access another requester's ticket metrics (Ownership Isolation) | `server/tests/lab-04/requester-dashboard.api.test.ts` | **PASS** |
| RD-03 | API | FR-05 | AC-05 | Requester dashboard metrics match database ticket status counts exactly | `server/tests/lab-04/requester-dashboard.api.test.ts` | **PASS** |
| SD-01 | API | FR-06 | AC-06 | IT Staff can view staff dashboard metrics (New, Open, In Progress, Waiting, Assigned, Urgent) | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| SD-02 | API | Authz | AC-06 | Reject non-staff users calling staff dashboard API (403 Forbidden) | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| SD-03 | API | FR-06 | AC-06 | Urgent calculation includes HIGH or URGENT priority from requester or IT staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | **PASS** |
| **Dashboard Consistency API** | | | | | | |
| CONS-01 | API | FR-06 | AC-06 | Every staff dashboard metric equals the matching ticket queue endpoint total | `server/tests/lab-04/dashboard-consistency.api.test.ts` | **PASS** |
| CONS-02 | API | FR-05 | AC-05 | Every requester dashboard metric equals the matching ticket list endpoint total | `server/tests/lab-04/dashboard-consistency.api.test.ts` | **PASS** |
| CONS-03 | API | Validation | AC-06 | Reject invalid status filter query parameters with 400 Bad Request | `server/tests/lab-04/dashboard-consistency.api.test.ts` | **PASS** |
| **Ticket Query Utility** | | | | | | |
| UTIL-01 | Unit | FR-06, FR-07 | AC-06 | Query builder correctly handles basic status and priority filters | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| UTIL-02 | Unit | FR-05, FR-06 | AC-06 | Query builder handles multiple comma-separated statuses (STAFF_OPEN_STATUSES) | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| UTIL-03 | Unit | FR-06 | AC-06 | Query builder handles isUrgent composite filter (HIGH or URGENT in active status) | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| UTIL-04 | Unit | FR-06 | AC-06 | Query builder ignores individual priorities when isUrgent is true | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| UTIL-05 | Unit | FR-06 | AC-06 | Query builder handles excludeStatus for active tickets | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| UTIL-06 | Unit | FR-06 | AC-06 | Query builder handles combination of status and excludeStatus | `server/tests/lab-04/ticket-query.util.test.ts` | **PASS** |
| **UI Components (Client)** | | | | | | |
| UI-01 | Client | FR-01, Authz | AC-01 | Actions Taken List: Renders formatted date, author badge, description, and follow-up note | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-02 | Client | FR-02 | AC-01 | Actions Taken Form: Submits new action successfully and asserts POST payload | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-03 | Client | FR-03, BR-03 | AC-03 | Actions Taken Form: Opens edit mode and submits update with PATCH | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-04 | Client | BR-03 | AC-03 | Actions Taken Form: Displays error banner when update fails with 409 Conflict | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-05 | Client | FR-04, BR-02 | AC-02 | Actions Taken Form: Conditional followUpNote input appears when followUpRequired is checked | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-06 | Client | Authz | AC-01 | Actions Taken List: Requester role hides Add Action and Edit Action buttons | `client/src/tests/lab-04/ActionsTaken.test.tsx` | **PASS** |
| UI-07 | Client | FR-06 | AC-06 | Staff Dashboard: Renders all 6 metric cards with correct values | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-08 | Client | FR-07 | AC-06 | Staff Dashboard: Clicking metric card navigates to queue with matching filter | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-09 | Client | FR-06 | AC-06 | Staff Dashboard: Displays urgent count badge and urgent tickets list | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-10 | Client | FR-06 | AC-06 | Staff Dashboard: Renders empty state when recentlyUpdated is empty | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-11 | Client | Authz | AC-06 | Staff Dashboard: Renders safe error alert when API returns 403 Forbidden | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-12 | Client | Reliability | AC-06 | Staff Dashboard: Renders safe error alert when fetch fails (500 safe failure) | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-13 | Client | A11y | AC-06 | Staff Dashboard: Keyboard navigation Tab focus rings and aria-labels on metric cards | `client/src/tests/lab-04/StaffDashboard.test.tsx` | **PASS** |
| UI-14 | Client | FR-05 | AC-05 | Requester Dashboard: Renders personalized metrics cards and recent tickets | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | **PASS** |
| UI-15 | Client | FR-07 | AC-05 | Requester Dashboard: Clicking My Open card filters requester ticket queue | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | **PASS** |
| UI-16 | Client | Reliability | AC-05 | Requester Dashboard: Renders safe error alert when fetch fails due to network error | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | **PASS** |
| UI-17 | Client | Authz | AC-05 | Requester Dashboard: Ownership isolation renders only authenticated requester tickets | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | **PASS** |
| UI-18 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for NEW | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-19 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for OPEN | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-20 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for IN_PROGRESS | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-21 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for WAITING_FOR_REQUESTER | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-22 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for RESOLVED | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-23 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for REOPENED | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-24 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for CLOSED | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-25 | Client | BR-01 | AC-04 | Ticket Workflow: Status dropdown options match ALLOWED_TRANSITIONS for CANCELLED | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| UI-26 | Client | Authz | AC-04 | Ticket Workflow: Requester role does not render status-select dropdown | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | **PASS** |
| **End-to-End (E2E Playwright)** | | | | | | |
| E2E-01 | E2E | FR-07, BR-01 | AC-07 | ActionsTaken duplicate-submit: `isSubmittingRef` guard blocks repeat clicks | `e2e/lab-04/actions-taken-flow.spec.ts` | **PASS** |
| E2E-02a | E2E | FR-04, BR-02 | AC-02 | followUpRequired=true with empty note triggers inline validation alert | `e2e/lab-04/actions-taken-flow.spec.ts` | **PASS** |
| E2E-02b | E2E | FR-01, Authz | AC-01 | REQUESTER entering own ticket does not see Add/Edit Action buttons | `e2e/lab-04/actions-taken-flow.spec.ts` | **PASS** |
| E2E-03a | E2E | BR-01 | AC-04 | Resolution Gate: Cannot resolve ticket without actions taken | `e2e/lab-04/ticket-resolution.spec.ts` | **PASS** |
| E2E-03b | E2E | BR-01 | AC-04 | Resolution Gate: Can resolve ticket after adding at least 1 action taken | `e2e/lab-04/ticket-resolution.spec.ts` | **PASS** |
| E2E-03c | E2E | BR-10 | AC-03 | Stale status 409 conflict flow with Thai toast notification without clearing form | `e2e/lab-04/ticket-resolution.spec.ts` | **PASS** |
| E2E-04a | E2E | FR-06, FR-07 | AC-06 | Staff dashboard cards match drill-down totals exactly | `e2e/lab-04/dashboards.spec.ts` | **PASS** |
| E2E-04b | E2E | FR-05, Authz | AC-05 | Requester A vs B ownership separation and API guard | `e2e/lab-04/dashboards.spec.ts` | **PASS** |
| E2E-05 | E2E | Hardening | AC-07 | Duplicate-click protection: creates only 1 ticket on rapid clicks | `e2e/lab-04/form-hardening.spec.ts` | **PASS** |
| E2E-06 | E2E | Hardening | AC-07 | Form retention: does not clear dirty form inputs on server error | `e2e/lab-04/form-hardening.spec.ts` | **PASS** |

---

## 4. Acceptance Criteria Coverage Mapping

| Acceptance Criteria | Description | Automated Tests Verifying AC | Status |
| :--- | :--- | :--- | :---: |
| **AC-01** | Actions Taken list rendering, date formatting, and requester read-only mode | API-01, API-03, API-06, UI-01, UI-02, UI-06, E2E-02b | **PASS** |
| **AC-02** | Conditional validation requiring followUpNote when followUpRequired is checked | API-02, UI-05, E2E-02a | **PASS** |
| **AC-03** | Optimistic locking 409 Conflict rejection for concurrent edits on actions and status | API-04, API-05, WF-03, UI-03, UI-04, E2E-03c | **PASS** |
| **AC-04** | Resolution Gate constraint blocking transition to RESOLVED without Actions Taken | WF-01, WF-02, WF-04, UI-18 through UI-26, E2E-03a, E2E-03b | **PASS** |
| **AC-05** | Requester dashboard metrics and ticket bridge with strict ownership isolation | RD-01, RD-02, RD-03, CONS-02, UI-14, UI-15, UI-16, UI-17, E2E-04b | **PASS** |
| **AC-06** | Staff dashboard queue metrics, urgent formula, and interactive drill-down navigation | SD-01, SD-02, SD-03, CONS-01, CONS-03, UTIL-01 to 06, UI-07 to 13, E2E-04a | **PASS** |
| **AC-07** | Concurrency hardening: double-click request prevention (`isSubmittingRef`) and form retention | E2E-01, E2E-05, E2E-06 | **PASS** |
