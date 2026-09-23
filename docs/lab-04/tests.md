# Lab 4 - Test Specification

| Test ID | Layer | Requirement | Scenario / Mapping to AC |
| :--- | :--- | :--- | :--- |
| **Actions Taken API** |
| API-01 | API | FR-02, BR-02 | Create Action Taken: Success (Valid payload, staff user) |
| API-02 | API | FR-02, BR-02 | Create Action Taken: Fail 400 (FollowUpRequired=true but no Note) |
| API-03 | API | Authz | Create Action Taken: Fail 403 (Requester attempting to create) |
| API-04 | API | FR-03, BR-03 | Update Action Taken: Success (Valid payload, valid version) |
| API-05 | API | BR-03 | Update Action Taken: Fail 409 (Stale update / Version mismatch) |
| **Ticket Workflow** |
| API-06 | API | BR-01 | Resolve Ticket: Success (Has Action Taken) |
| API-07 | API | BR-01 | Resolve Ticket: Fail 400 (No Action Taken) |
| **Dashboards API** |
| API-08 | API | FR-05, Authz | Requester Dashboard: Scoped strictly to req.user.id |
| API-09 | API | FR-06 | Staff Dashboard: Global metrics match DB counts |
| **UI Components** |
| UI-01 | Client | FR-01, Authz | Actions Taken List: Renders correctly, hides Create button for Requester |
| UI-02 | Client | FR-04 | Actions Taken Form: FollowUpNote conditionally required |
| **End-to-End** |
| E2E-01 | E2E | FR-07, BR-01 | Staff Flow: Create Action Taken -> Resolve Ticket -> View in Dashboard |
| E2E-02 | E2E | FR-05, FR-07 | Requester Flow: View Dashboard -> Click "My Open" -> Drill down list |
