# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the authenticated TokTickIT platform by replacing the temporary Development Requester selector with secure email/password authentication, role-based authorization across three distinct roles (Requester, IT Staff, Administrator), an operational IT Staff Ticket Queue with Public Comments and Internal Notes, and a minimalist Administrator User Management interface.

## 2. Stakeholder Request Interpretation
The system must transition from simulated identity to production-grade access control. Authentication requires email/password credentials with mandatory password changes upon initial setup. Authorization must be strictly enforced on the server side: Requesters retain access only to their own tickets; IT Staff manage a shared ticket queue, update priorities/statuses, and record internal notes; Administrators manage user lifecycles without interfering with ticket workflows unless authorized. All interfaces must uphold the Zen Green design tokens.

## 3. Scope
### Included
- Secure login, logout, current user retrieval (`/api/auth/me`), and mandatory first-login password change.
- Server-side role-based authorization for Requester, IT Staff, and Administrator.
- Requester migration: Wire existing ticket creation, list, detail, and attachments to the authenticated user; add Public Comments and "Problem Appears Resolved" indication.
- IT Staff Ticket Queue: Search, category/priority/status filters, sorting, pagination, and detail inspection.
- IT Staff Ticket Operations: Claim/reassign ownership, IT Priority updates, permitted status transitions, append-only Public Comments, and append-only Internal Notes.
- Administrator User Management: User listing, search, role filtering, account creation with initial password, basic profile edit, account activation/deactivation, and password reset.
- Responsive Zen Green UI matching Desktop (≥992px), Tablet (768–991px), and Mobile (<768px).
- Prisma/PostgreSQL migration and idempotent seed data for all roles and workflows.

### Excluded
- Self-registration and public sign-up.
- Multi-factor authentication (MFA), SSO, social logins, and password reset via email.
- IT Staff Actions Taken (deferred to Lab 4) and formal SLA calculation engines.
- Multiple roles per single user account.
- Hard user deletion, bulk user operations, and department/profile-picture hierarchies.

## 4. Functional Requirements
- **FR-01 (Authentication):** The system shall allow active users to authenticate using email and password, establishing an authenticated session/token, and allow users to log out.
- **FR-02 (Mandatory Password Change):** The system shall enforce a mandatory password change immediately after login for any user marked with `mustChangePassword = true`, blocking access to standard screens until fulfilled.
- **FR-03 (Requester Ticket Continuity):** The system shall associate created tickets and attachment interactions with the authenticated Requester identity instead of client-supplied IDs.
- **FR-04 (Requester Resolution Feedback):** The system shall permit the ticket creator to append Public Comments and indicate that the problem appears resolved.
- **FR-05 (Staff Ticket Queue):** The system shall provide IT Staff with a paginated, filterable, and sortable queue of all support tickets across the organization.
- **FR-06 (Staff Operational Controls):** The system shall allow IT Staff to claim/reassign ticket ownership, update IT Priority, and transition ticket status across permitted states.
- **FR-07 (Communication Isolation):** The system shall provide append-only Public Comments visible to all roles and append-only Internal Notes restricted strictly to IT Staff and Administrators.
- **FR-08 (Administrator User Management):** The system shall enable Administrators to list, search, filter, create, edit, activate/deactivate user accounts, and assign initial temporary passwords.

## 5. Business Rules
- **BR-01 (Active Credential Gate):** Only an active user account (`isActive = true`) with valid credentials may authenticate. Deactivated accounts must receive a generic authentication failure.
- **BR-02 (First-Login Guard):** A user flagged with `mustChangePassword = true` cannot access any application endpoint or screen other than the password change and logout flows.
- **BR-03 (Server-Enforced Ownership):** Ticket and attachment ownership is determined solely by the authenticated token/session. Client-provided requester identifiers are ignored.
- **BR-04 (Communication Visibility):** Public Comments are visible to the Requester, IT Staff, and Administrator. Internal Notes are strictly confidential to IT Staff and Administrator; any attempt by a Requester to fetch or post internal notes must yield HTTP 403 Forbidden.
- **BR-05 (Resolution Boundary):** A Requester may indicate a problem appears resolved, but only IT Staff (or Administrator) can transition a ticket status to `Resolved` or `Closed`.
- **BR-06 (Ticket Status Lifecycle):** Valid status transitions must adhere to the lifecycle matrix:
  - `New` → `Open`, `Cancelled`
  - `Open` → `In Progress`, `Waiting for Requester`, `Cancelled`
  - `In Progress` → `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` → `In Progress`, `Resolved`
  - `Resolved` → `Closed`, `Reopened`
  - `Reopened` → `In Progress`
- **BR-07 (Single Role Assignment):** Each user account must have exactly one role: `Requester`, `IT_Staff`, or `Administrator`.
- **BR-08 (Administrator Safety Constraints):**
  - An Administrator cannot deactivate their own currently active account.
  - An Administrator cannot deactivate or revoke the role of the last active Administrator in the system.
  - User records must never be hard-deleted from the database; lifecycle is managed via `isActive`.
- **BR-09 (Credential Security):** Passwords must be hashed with bcrypt/argon2 before persistence. Plaintext passwords must never be logged, transmitted in responses, or committed.
- **BR-10 (Ticket Assignment Rule):** Ticket ownership can only be assigned to an active user whose role is `IT_STAFF` or `ADMINISTRATOR`. The backend must reject assignments to inactive users or incorrect roles.
- **BR-11 (IT Priority Change Rule):** The `Requested Priority` set by the Requester at ticket creation must never be modified by any role. Only `IT Priority` may be modified by IT Staff or Administrators.

## 6. Authorization Matrix

| Endpoint Group / Operation | Requester | IT Staff | Administrator | Unauthenticated |
| :--- | :--- | :--- | :--- | :--- |
| **POST /api/auth/login** | Allowed | Allowed | Allowed | Allowed |
| **POST /api/auth/change-password** | Allowed (Self) | Allowed (Self) | Allowed (Self) | Denied (401) |
| **GET /api/tickets (Requester list)** | Allowed (Own only) | Allowed | Allowed | Denied (401) |
| **POST /api/tickets (Create)** | Allowed | Allowed | Allowed | Denied (401) |
| **GET /api/staff/queue** | Denied (403) | Allowed | Allowed | Denied (401) |
| **PATCH /api/staff/tickets/:id (Status/Assign)** | Denied (403) | Allowed | Allowed | Denied (401) |
| **POST /api/tickets/:id/comments (Public)** | Allowed (Owner) | Allowed | Allowed | Denied (401) |
| **GET/POST /api/tickets/:id/notes (Internal)** | Denied (403) | Allowed | Allowed | Denied (401) |
| **GET /api/admin/users** | Denied (403) | Denied (403) | Allowed | Denied (401) |
| **POST /api/admin/users** | Denied (403) | Denied (403) | Allowed | Denied (401) |
| **PATCH /api/admin/users/:id** | Denied (403) | Denied (403) | Allowed | Denied (401) |

## 7. Data Changes
- **Model `User`:**
  - `id` (Int, PK), `email` (String, Unique), `passwordHash` (String), `fullName` (String), `role` (Enum: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), `isActive` (Boolean, default true), `mustChangePassword` (Boolean, default false), `createdAt`, `updatedAt`.
- **Model `Ticket` updates:**
  - Link `requesterUserId` -> `User.id`.
  - Add `assignedStaffId` -> optional FK to `User.id` (IT Staff / Admin).
  - Add `itPriority` (Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT` - defaults to requestedPriority).
  - Update `currentStatus` enum: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **Model `PublicComment`:**
  - `id` (Int, PK), `ticketId` (FK), `authorId` (FK to `User`), `content` (Text), `createdAt`.
- **Model `InternalNote`:**
  - `id` (Int, PK), `ticketId` (FK), `authorId` (FK to `User`), `content` (Text), `createdAt`.
- **Indexes:**
  - `User.email` (Unique) for fast login lookups.
  - `Ticket.assignedStaffId`, `Ticket.currentStatus`, `Ticket.itPriority` to support efficient staff queue filtering and sorting.
- **Migration Strategy:**
  - The Lab 2 `RequesterUser` table will be renamed/migrated to the new `User` model. All existing records will be assigned the role `REQUESTER` to preserve ticket ownership and prevent data loss.
- **Seed Decisions:**
  - The seed script must be idempotent (safe to run repeatedly using upserts).
  - It will generate active and inactive accounts covering all 3 roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) and populate initial Tickets, Comments, and Internal Notes.

## 8. API Contract Summary
- Detailed schema definitions are specified in `docs/lab-03/api-spec.md`.
- Endpoints return JSON responses with standard HTTP error structures (`{ "error": { "code": string, "message": string } }`).

## 9. Acceptance Criteria
- **AC-01:** Given valid active credentials, when a user logs in, the backend returns authenticated session tokens and user identity matching their role.
- **AC-02:** Given a user with `mustChangePassword = true`, when attempting to view standard dashboards, the application redirects to and accepts only password change operations.
- **AC-03:** Given an authenticated Requester, when submitting ticket operations, the backend derives identity from the session token and rejects access to other requesters' tickets with 403 or 404.
- **AC-04:** Given a Requester account, any request targeting `/api/tickets/:id/notes` returns 403 Forbidden without leaking note existence.
- **AC-05:** Given an IT Staff user, when accessing the queue, tickets can be filtered by category, status, priority, and searched by ticket number or summary.
- **AC-06:** Given an Administrator, when attempting to deactivate their own account or the last active administrator, the operation is blocked with 400 Bad Request.
- **AC-07:** Given the Lab 2 database with existing Requester and Ticket records, 
  when the Lab 3 migration runs, the schema evolves to support Users/Roles without 
  losing any existing Ticket or Attachment data.
- **AC-08:** Given the seed script runs, when executed, it generates active and 
  inactive accounts for all 3 roles and populates initial Tickets, Comments, and 
  Internal Notes.
- **AC-09:** Given an authenticated user, when attempting to post a Public Comment, the comment is successfully appended and visible to all permitted roles.
- **AC-10:** Given an authenticated Requester, when marking a ticket as "Problem Appears Resolved", the backend successfully records this indication without changing the ticket's formal status.
- **AC-11:** Given an IT Staff user, when attempting to claim or reassign a ticket, the ownership is updated successfully.
- **AC-12:** Given an IT Staff user, when attempting an invalid status transition (e.g., from Closed back to New), the backend rejects the operation with a 400 Bad Request.
- **AC-13:** Given an Administrator creating a user, when supplying an email that already exists in the system, the backend rejects the creation with a conflict error.
- **AC-14:** Given assignment to an inactive user or user without IT_STAFF/ ADMINISTRATOR role, the backend rejects the assignment. (BR-10)
- **AC-15:** Given a request attempting to modify Requested Priority after ticket creation, the backend rejects or ignores the change. (BR-11)

## 10. UI Specification Summary
- **Screen Structure & Roles:** The UI reuses the Zen Green design system. Role-based navigation prevents unauthorized access to views.
- **Modes:** Interfaces define distinct Create, View, and Edit modes with clear editable vs read-only styling boundaries.
- **Controls & Feedback:** Screens provide comprehensive feedback states including loading spinners, save success toasts, inline validation errors, empty/no-results placeholders, forbidden access messages, not-found states, conflict errors, and safe generic API failure feedback.
- **Responsive Rules:** All interfaces maintain usability and avoid horizontal clipping across Desktop (≥992px), Tablet (768-991px), and Mobile (<768px).
- For complete UI details, refer to `docs/lab-03/ui-spec.md`.

## 11. Definition of Done
- Complete implementation of all 11 Lab 3 sprint issues.
- 100% PASS on automated tests: Unit, API, UI, Authorization, Regression, and E2E Playwright suites.
- Strict compliance with Zen Green tokens and responsive viewports without horizontal clipping.
- Verified commit timestamps proving `specification.md` existed before feature PR completions.
- Peer review approved and merged into `lab3-staging` and `main`.

## 12. Assumptions and Decisions
- **Session/Token Mechanism:** Stateless JWT (JSON Web Tokens) via HTTP Bearer headers is utilized for authentication, rather than server-side session stores, to minimize backend state overhead. Token invalidation on logout is handled client-side.
- **Password Complexity:** While FR-02 mandates a password change, complexity rules (minimum length of 8 characters) have been enforced to maintain a basic security baseline, despite not being explicitly defined in the initial stakeholder request.