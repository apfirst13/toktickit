# Lab 4 - Specification

## 1. Functional Requirements (FR)

### Actions Taken
- **FR-01**: Users can view the Actions Taken for a specific ticket.
- **FR-02**: IT Staff and Administrators can add a new Action Taken to a ticket.
- **FR-03**: IT Staff and Administrators can edit an existing Action Taken (subject to optimistic concurrency control).
- **FR-04**: The system must enforce a conditional requirement for `followUpNote` when `followUpRequired` is true.

### Dashboards
- **FR-05**: Requesters have a personalized dashboard showing summary metrics (My Open, In Progress, Resolved, Closed).
- **FR-06**: IT Staff/Administrators have a dashboard showing queue metrics (New, Open, In Progress, Waiting for Requester, My Assigned).
- **FR-07**: Dashboard metric cards must be clickable, drilling down into a filtered list of tickets corresponding to the metric.

## 2. Business Rules (BR)

- **BR-01 (Resolution Gate)**: A ticket cannot be transitioned to the `RESOLVED` status unless it has at least one associated `ActionTaken` record. This ensures that the resolution has been documented.
- **BR-02 (Follow-up Note)**: If an Action Taken is marked as requiring a follow-up (`followUpRequired` = true), the `followUpNote` must not be empty.
- **BR-03 (Optimistic Concurrency)**: Updates to an Action Taken must include the current `version`. If the provided version does not match the database version, the update is rejected (HTTP 409) to prevent lost updates.

## 3. Authorization Matrix

| Feature | Role | Permission Level | Scope Restrictions |
| :--- | :--- | :--- | :--- |
| Actions Taken | REQUESTER | Read-only | Only for tickets where they are the requester (`ticket.requesterUserId == req.user.id`). |
| Actions Taken | IT_STAFF | Create, Read, Update | All tickets (not limited to assigned tickets). |
| Actions Taken | ADMINISTRATOR | Create, Read, Update | All tickets. |
| Requester Dashboard | REQUESTER | Read-only | Personal metrics only (scoping based on `req.user.id`). |
| Staff Dashboard | IT_STAFF | Read-only | Global queue metrics and personal assigned metrics. |
| Staff Dashboard | ADMINISTRATOR | Read-only | Global queue metrics and personal assigned metrics (shares view with IT Staff). |

## 4. Dashboard Metric Definitions

### Requester Dashboard
- **My Open**: Tickets created by the user with status `NEW`, `OPEN`, or `REOPENED`. *Justification: REOPENED tickets are tickets the requester disagreed with, so they still require active attention — grouped with open work.*
- **In Progress**: Tickets created by the user with status `IN_PROGRESS` only. *(Distinct from Waiting — staff is actively working.)*
- **Waiting for You**: Tickets created by the user with status `WAITING_FOR_REQUESTER`. *(Displayed as a separate card — requires action from the requester specifically.)*
- **Resolved**: Tickets created by the user with status `RESOLVED`.
- **Closed**: Tickets created by the user with status `CLOSED`.
- **Recently Updated**: Tickets created by the user where `updatedAt` is within the last 7 days. *Justification*: 7 days is a standard operational window for users to track recent activities without overwhelming the view.

### IT Staff / Administrator Dashboard
- **New**: All tickets with status `NEW`.
- **Open**: All tickets with status `OPEN` or `REOPENED`. *Justification: REOPENED tickets re-enter the active queue and must be visible to IT Staff alongside newly-opened tickets.*
- **In Progress**: All tickets with status `IN_PROGRESS` only.
- **Waiting for Requester**: All tickets with status `WAITING_FOR_REQUESTER`.
- **My Assigned**: Tickets where `assignedStaffId` matches the current user's ID, regardless of status (excluding `CLOSED` and `CANCELLED`).
- **Urgent Tickets**: Tickets with `requestedPriority` or `itPriority` as `URGENT` or `HIGH` that are not `RESOLVED`, `CLOSED`, or `CANCELLED`.

## 5. Assumptions and Decisions

- **Resolution Gate**: We decided to enforce BR-01 (A ticket cannot be resolved without an Action Taken) strictly at the API layer. *Justification*: This ensures auditability and forces IT Staff to formally document what was done to fix an issue before it can be closed out, improving knowledge management.
- **DB Decision 1 (Optimistic Concurrency via `version` column)**: Added an integer `version` field to the `ActionTaken` model. *Justification*: Since multiple staff members might be working on or reviewing a ticket simultaneously, this prevents a "lost update" anomaly where one staff member accidentally overwrites another's edits to an action record without realizing it.
- **DB Decision 2 (`performedById` mapping)**: The `performedById` in `ActionTaken` references `User(id)` with `onDelete: Restrict`. *Justification*: Actions taken represent a historical audit trail of who did what. We must not allow deleting a user if they have performed actions, ensuring the integrity of the audit log.