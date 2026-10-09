# Lab 4 - Test Specification

| Test ID | Layer | Requirement | Scenario / Mapping to AC | Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Actions Taken API** | | | | | |
| API-01 | API | FR-02, BR-02 | Create Action Taken: Success (Valid payload, staff user) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-02 | API | FR-02, BR-02 | Create Action Taken: Fail 400 (FollowUpRequired=true but no Note) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-03 | API | Authz | Create Action Taken: Fail 403 (Requester attempting to create) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-04 | API | FR-03, BR-03 | Update Action Taken: Success (Valid payload, valid version) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-05 | API | BR-03 | Update Action Taken: Fail 409 (Stale update / Version mismatch) | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **Ticket Workflow API** | | | | | |
| API-06 | API | BR-01 | Resolve Ticket: Success (Has Action Taken) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-07 | API | BR-01 | Resolve Ticket: Fail 400 (No Action Taken) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **Dashboards API** | | | | | |
| API-08 | API | FR-05, Authz | Requester Dashboard: Scoped strictly to req.user.id | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| API-09 | API | FR-06 | Staff Dashboard: Global metrics match DB counts | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **UI Components** | | | | | |
| UI-01 | Client | FR-01, Authz | Actions Taken List: Renders correctly, hides Create button for Requester | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-02 | Client | FR-04 | Actions Taken Form: FollowUpNote conditionally required | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-03 | Client | BR-01 | Ticket Workflow: Status dropdown renders for staff | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| UI-04 | Client | FR-05 | Requester Dashboard Components Render | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| UI-05 | Client | FR-06 | Staff Dashboard Components Render | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **End-to-End** | | | | | |
| E2E-01 | E2E | FR-07, BR-01 | Actions Taken UI guard against duplicate submissions | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| E2E-02 | E2E | FR-07, BR-01 | Ticket Resolution dropdown flow | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| E2E-03 | E2E | FR-05, FR-06 | Dashboards render correctly without mutating | `e2e/lab-04/dashboards.spec.ts` | Pass |
