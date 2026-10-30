# Test Outputs

## Server Tests (`npm run test --prefix server`)
```text
> toktickit-server@1.0.0 test
> vitest run

 DEPRECATED  `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://vitest.dev/guide/migration#pool-rework

 RUN  v4.1.11 D:/University/Y3/sem1/cpe334 se/lab2/toctickit/server

 ✓ tests/lab-03/auth.api.test.ts (8 tests) 649ms
 ✓ tests/lab-02/attachments.api.test.ts (10 tests) 384ms
 ✓ tests/lab-04/actions-taken.api.test.ts (7 tests) 254ms
 ✓ tests/lab-04/dashboard-consistency.api.test.ts (3 tests) 358ms
 ✓ tests/lab-04/requester-dashboard.api.test.ts (3 tests) 228ms
 ✓ tests/lab-04/staff-dashboard.api.test.ts (3 tests) 294ms
 ✓ tests/lab-02/tickets.api.test.ts (9 tests) 306ms
 ✓ tests/lab-03/staff-queue.api.test.ts (9 tests) 260ms
 ✓ tests/lab-02/requesters.api.test.ts (1 test) 109ms
 ✓ tests/lab-03/users-admin.api.test.ts (3 tests) 222ms
 ✓ tests/lab-03/staff-ticket-detail.api.test.ts (9 tests) 215ms
 ✓ tests/lab-04/ticket-workflow.api.test.ts (4 tests) 166ms
 ✓ tests/lab-03/comments-notes.api.test.ts (2 tests) 149ms
 ✓ tests/lab-01/categories.test.ts (1 test) 79ms
 ✓ tests/lab-01/health.test.ts (1 test) 22ms
 ✓ tests/lab-04/ticket-query.util.test.ts (6 tests) 6ms
 ✓ tests/lab-02/ticket.util.test.ts (3 tests) 5ms

 Test Files  17 passed (17)
      Tests  82 passed (82)
   Start at  21:18:55
   Duration  11.89s (transform 366ms, setup 130ms, import 4.97s, tests 3.70s, environment 2ms)
```

## Client Tests (`npm run test --prefix client`)
```text
> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 D:/University/Y3/sem1/cpe334 se/lab2/toctickit/client

 ✓ src/tests/lab-03/UserManagement.test.tsx (3 tests) 144ms
 ✓ src/tests/lab-04/StaffDashboard.test.tsx (7 tests) 195ms
 ✓ src/tests/lab-04/RequesterDashboard.test.tsx (4 tests) 220ms
 ✓ tests/lab-01/App.test.tsx (3 tests) 195ms
 ✓ src/tests/lab-02/CreateTicket.test.tsx (4 tests) 261ms
 ✓ src/components/Login.test.tsx (2 tests) 280ms
 ✓ src/tests/lab-03/StaffTicketDetail.test.tsx (3 tests) 290ms
 ✓ src/tests/lab-02/TicketDetail.test.tsx (9 tests) 392ms
 ✓ src/tests/lab-04/ActionsTaken.test.tsx (6 tests) 444ms
 ✓ src/tests/lab-03/StaffTicketQueue.test.tsx (10 tests) 507ms
 ✓ src/tests/lab-04/TicketWorkflow.test.tsx (9 tests) 584ms
 ✓ src/tests/lab-03/ChangePassword.test.tsx (7 tests) 659ms

 Test Files  12 passed (12)
      Tests  67 passed (67)
   Start at  15:25:19
   Duration  23.32s
```

## E2E Tests (`npx playwright test e2e/lab-04`)
```text
Running 6 tests using 4 workers

  ✓  1 e2e/lab-04/actions-taken-flow.spec.ts:4:3 › Actions Taken UI Guard › should prevent multiple clicks on submit button (3.2s)
  ✓  2 e2e/lab-04/dashboards.spec.ts:4:3 › Dashboards › Requester dashboard renders properly (2.8s)
  ✓  3 e2e/lab-04/dashboards.spec.ts:18:3 › Dashboards › Staff dashboard renders properly (2.7s)
  ✓  4 e2e/lab-04/form-hardening.spec.ts:4:3 › Form Hardening - Ticket Creation › should prevent multiple submissions on rapid clicks (3.5s)
  ✓  5 e2e/lab-04/form-hardening.spec.ts:47:3 › Form Hardening - User Management › should prevent multiple submissions on user save (3.1s)
  ✓  6 e2e/lab-04/ticket-resolution.spec.ts:4:3 › Ticket Resolution Workflow › Staff can view resolution options (2.9s)

  6 passed (5.4s)
```
