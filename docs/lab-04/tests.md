# Lab 4 - Test Specification

| Test ID | Layer | Requirement | AC | Scenario / Description | Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Actions Taken API** | | | | | | |
| API-01 | API | FR-02, BR-02 | ไม่มี AC ตรง | API-01: Should allow POST from IT Staff (201) | `server/tests/lab-04/actions-taken.api.test.ts` | Pending (รันจริงบน main) |
| API-02 | API | FR-04, BR-02 | ไม่มี AC ตรง | API-02: Should reject POST if followUpRequired is true but followUpNote is missing (400) | `server/tests/lab-04/actions-taken.api.test.ts` | Pending (รันจริงบน main) |
| API-03 | API | Authz | ไม่มี AC ตรง | API-03: Should reject POST from Requester (403) | `server/tests/lab-04/actions-taken.api.test.ts` | Pending (รันจริงบน main) |
| API-04 | API | FR-03, BR-03 | ไม่มี AC ตรง | API-04: Should allow PATCH if version matches (200) | `server/tests/lab-04/actions-taken.api.test.ts` | Pending (รันจริงบน main) |
| API-05 | API | BR-03 | ไม่มี AC ตรง | API-05: Should reject PATCH if version is stale (409) | `server/tests/lab-04/actions-taken.api.test.ts` | Pending (รันจริงบน main) |
| **Ticket Workflow API** | | | | | | |
| API-06 | API | BR-01 | ไม่มี AC ตรง | API-06: should allow transitioning to RESOLVED if it has at least one Action Taken | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending (รันจริงบน main) |
| API-07 | API | BR-01 | ไม่มี AC ตรง | API-07: should reject transitioning to RESOLVED if it has no Action Taken | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending (รันจริงบน main) |
| **Dashboards API** | | | | | | |
| API-08 | API | FR-05, Authz | ไม่มี AC ตรง | API-08: should return requester dashboard metrics scoped strictly to req.user.id | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pending (รันจริงบน main) |
| API-09 | API | FR-06 | ไม่มี AC ตรง | API-09: IT Staff can view staff dashboard metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending (รันจริงบน main) |
| **Dashboard Consistency API** | | | | | | |
| API-CONS-01 | API | FR-06 | ไม่มี AC ตรง | API-09: Every staff dashboard metric must equal the matching queue endpoint (imported constants) | `server/tests/lab-04/dashboard-consistency.api.test.ts` | Pending (รันจริงบน main) |
| API-CONS-02 | API | FR-05 | ไม่มี AC ตรง | API-10: Every requester dashboard metric must equal the matching list endpoint (imported constants) | `server/tests/lab-04/dashboard-consistency.api.test.ts` | Pending (รันจริงบน main) |
| API-CONS-03 | API | ไม่มี FR/BR ตรง | ไม่มี AC ตรง | API-11: Should return 400 for invalid status query parameter | `server/tests/lab-04/dashboard-consistency.api.test.ts` | Pending (รันจริงบน main) |
| **Ticket Query Utility** | | | | | | |
| UTIL-01 | Unit | FR-06, FR-07 | ไม่มี AC ตรง | should handle basic filters | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| UTIL-02 | Unit | FR-05, FR-06 | ไม่มี AC ตรง | should handle multiple status comma-separated | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| UTIL-03 | Unit | FR-06 | ไม่มี AC ตรง | should handle isUrgent with existing search (merging ORs into AND) | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| UTIL-04 | Unit | FR-06 | ไม่มี AC ตรง | should ignore priorities when isUrgent is true | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| UTIL-05 | Unit | FR-06 | ไม่มี AC ตรง | should handle excludeStatus | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| UTIL-06 | Unit | FR-06 | ไม่มี AC ตรง | should handle both status and excludeStatus | `server/tests/lab-04/ticket-query.util.test.ts` | Pending (รันจริงบน main) |
| **UI Components** | | | | | | |
| UI-01 | Client | FR-01, Authz | ไม่มี AC ตรง | Actions Taken List: Renders correctly, hides Create button for Requester | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pending (รันจริงบน main) |
| UI-02 | Client | FR-04 | ไม่มี AC ตรง | Actions Taken Form: FollowUpNote conditionally required | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pending (รันจริงบน main) |
| UI-03 | Client | BR-01 | ไม่มี AC ตรง | Ticket Workflow: Status dropdown exact match with transitions and roles | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Pending (รันจริงบน main) |
| UI-04 | Client | FR-05 | ไม่มี AC ตรง | Requester Dashboard Components Render | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Pending (รันจริงบน main) |
| UI-05 | Client | FR-06 | ไม่มี AC ตรง | Staff Dashboard Components Render | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Pending (รันจริงบน main) |
| **Extra API** | | | | | | |
| API-N01 | API | FR-02 | ไม่มี AC ตรง | N01: staff คนละคนกับ owner POST /api/tickets/:id/actions -> 201 + assert DB | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N02 | API | Authz | ไม่มี AC ตรง | N02: REQUESTER POST action -> 403 | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N03 | API | ไม่มี FR/BR ตรง | ไม่มี AC ตรง | N03: POST /api/tickets/:id/appears-resolved -> 200 สถานะไม่เปลี่ยน | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N04 | API | Authz | ไม่มี AC ตรง | N04: Requester B เปิดตั๋วของ A -> 404 | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N05 | API | Authz | ไม่มี AC ตรง | N05: REQUESTER เรียก /api/dashboard/staff -> 403 | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N06 | API | ไม่มี FR/BR ตรง | ไม่มี AC ตรง | N06: PATCH assignedStaffId control: active -> 200 แล้ว inactive -> 400 + assert error message | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N07 | API | ไม่มี FR/BR ตรง | ไม่มี AC ตรง | N07: GET actions เรียง actionDateTime asc | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| API-N08 | API | Authz | ไม่มี AC ตรง | N08: REQUESTER PUT/PATCH action -> 403 | `server/tests/lab-04/actions-taken-extra.api.test.ts` | Pending (รันจริงบน main) |
| **End-to-End** | | | | | | |
| E2E-01 | E2E | FR-07, BR-01 | ไม่มี AC ตรง | ActionsTaken duplicate-submit: state guard must block repeat submissions on rapid clicks | `e2e/lab-04/actions-taken-flow.spec.ts` | Pending (รันจริงบน main)* |
| E2E-02a | E2E | FR-04 | ไม่มี AC ตรง | E2E-02a: FR-04 - followUpRequired=true with empty note triggers alert in DOM | `e2e/lab-04/actions-taken-flow.spec.ts` | Red until fix PR |
| E2E-02b | E2E | FR-01 | ไม่มี AC ตรง | E2E-02b: FR-01 - REQUESTER entering own ticket does not see Add/Edit Action buttons | `e2e/lab-04/actions-taken-flow.spec.ts` | Pending (รันจริงบน main) |
| E2E-03a | E2E | BR-01 | ไม่มี AC ตรง | E2E-03a: BR-01 - Cannot resolve ticket without actions | `e2e/lab-04/ticket-resolution.spec.ts` | Pending (รันจริงบน main) |
| E2E-03b | E2E | BR-01 | ไม่มี AC ตรง | E2E-03b: BR-01 - Can resolve ticket with actions | `e2e/lab-04/ticket-resolution.spec.ts` | Pending (รันจริงบน main) |
| E2E-03c | E2E | BR-10 | ไม่มี AC ตรง | E2E-03c: BR-10 - Stale status 409 flow | `e2e/lab-04/ticket-resolution.spec.ts` | Pending (รันจริงบน main) |
| E2E-04a | E2E | FR-06 | ไม่มี AC ตรง | E2E-04a: Staff dashboard cards match drill-down totals exactly | `e2e/lab-04/dashboards.spec.ts` | Red until fix PR |
| E2E-04b | E2E | FR-05, FR-06 | ไม่มี AC ตรง | E2E-04b: Requester A vs B separation and API Guard | `e2e/lab-04/dashboards.spec.ts` | Pending (รันจริงบน main) |
| E2E-05 | E2E | FR-07 | ไม่มี AC ตรง | Duplicate-click protection: should create only 1 ticket on rapid clicks | `e2e/lab-04/form-hardening.spec.ts` | Pending (รันจริงบน main) |
| E2E-06 | E2E | FR-07 | ไม่มี AC ตรง | Form retention: should not clear form on server error | `e2e/lab-04/form-hardening.spec.ts` | Pending (รันจริงบน main) |

*หมายเหตุ E2E-01 (duplicate-submit): ครอบคลุมคลิก synchronous ใน tick เดียว (guard = isSubmittingRef) ไม่ครอบคลุม disabled
