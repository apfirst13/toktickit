# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the initial Requester-facing MVP for TokTickIT. This sprint enables a simulated requester to create tickets, view their own ticket list, and manage attachments securely within an enforced ownership context, laying the foundation before real authentication is introduced in Lab 3.

## 2. Stakeholder Request Interpretation
The IT department needs a functional and responsive ticketing portal for Requesters. Since secure login is not yet available, we must implement a temporary "Development Requester" selector to simulate user sessions and test multi-user ticket isolation. Requesters must be able to submit tickets with allowed attachments, view a list of their tickets (with search, filter, sort, and pagination), and see read-only details of a ticket while managing its attachments (upload, download, soft removal).

## 3. Scope
### Included
- Development Requester selection screen (mock login mechanism).
- Create Ticket form with client-side and server-side validation.
- My Tickets list supporting pagination, searching, sorting, and filtering.
- Requester Ticket Detail screen (read-only fields).
- Attachment management: Upload (JPG/PNG/WEBP/PDF, max 5MB, up to 5 per ticket), download, and soft removal.
- Responsive UI implementation following the "Zen Green Theme".
- Prisma/PostgreSQL database models for Ticket, Attachment, Category, RelatedSystem, and RequesterUser.

### Excluded
- Real authentication, sessions, tokens, and role-based authorization.
- IT Staff workflow (queues, claiming, reassigning tickets).
- Ticket collaboration features (Public Comments, Internal Notes, Actions Taken).
- Ticket lifecycle status changes beyond the initial "New" status.
- Administrator management functions.

## 4. Functional Requirements
- **FR-01**: The system shall provide a Development Requester selector to establish the current requester context for testing.
- **FR-02**: The system shall allow the selected requester to create a new support ticket by providing a summary, description, category, related system, and priority.
- **FR-03**: The system shall display a paginated list of tickets owned *only* by the currently selected requester.
- **FR-04**: The system shall allow the requester to view the details of an existing ticket they own in a read-only format.
- **FR-05**: The system shall allow the requester to upload, download, and soft-remove allowed file attachments (up to 5MB per file) on their owned tickets.

## 5. Business Rules
- **BR-01**: A newly created Ticket must automatically be assigned a unique official Ticket Number by the system and start with a Current Status of "New".
- **BR-02**: The selected Development Requester context acts as the ticket owner; a requester cannot view, access, or modify tickets or attachments belonging to another requester.
- **BR-03**: A maximum of 5 active (non-removed) attachments are allowed per ticket.
- **BR-04**: Attachment removal must be implemented as a "soft removal"; the file metadata remains in the database marked as removed (or inactive), and the file can no longer be downloaded or previewed.
- **BR-05**: The temporary Development Requester selector is for testing purposes only and must not be treated as a secure authentication mechanism.
- **BR-06 (Attachment Limits):** Soft-removed attachments **DO NOT** count towards the 5 active attachments limit. The aggregate size limit per ticket is 25MB (5 files x 5MB).
- **BR-07 (File Storage):** Attachments will be stored on the local file system in an `/uploads` directory. Files will be renamed using `UUID` to prevent naming collisions.
## 6. UI Specification Summary
The application must strictly follow the "Zen Green Theme" (Primary color: #006B3C). Layouts must adapt to mobile (< 768px), tablet (768-991px), and desktop (≥ 992px) viewports without horizontal scrolling. Forms must display clear validation errors placed immediately below the respective fields. Submit buttons must display a busy state during API calls. Read-only fields in the Ticket Detail screen must have a distinct visual style (e.g., soft gray-green background) compared to editable fields.

## 7. Data Changes
New Prisma models required:
- `RequesterUser`: Represents the development requesters (seeded data).
- `Category`: Lookup table for ticket categories.
- `RelatedSystem`: Lookup table for affected systems.
- `Ticket`: Core model storing ticket details, linked to `RequesterUser`, `Category`, and `RelatedSystem`.
- `Attachment`: Stores file metadata, linked to `Ticket`. Must include a `isRemoved` (Boolean) or `removedAt` (DateTime) field to support soft removal.
```prisma
model Ticket {
  id                Int      @id @default(autoincrement())
  ticketNumber      String   @unique
  summary           String   @db.VarChar(200)
  attachments       Attachment[]
  // ... other fields and relations
}
## 8. API Contract
- `GET /api/requesters`: Retrieve active development requesters.
- `POST /api/tickets`: Create a new ticket (validates input, associates with requester).
- `GET /api/tickets`: Retrieve a paginated, filtered, and sorted list of tickets owned by the current requester.
- `GET /api/tickets/:id`: Retrieve specific ticket details (enforces ownership).
- `POST /api/tickets/:id/attachments`: Upload an attachment to a specific ticket.
- `DELETE /api/tickets/:id/attachments/:attachmentId`: Soft-remove a specific attachment.

## 9. Acceptance Criteria
- **AC-01**: Given valid ticket data and a selected requester, when the form is submitted, then one new Ticket is saved in the database associated with the requester and a unique Ticket Number is returned.
- **AC-02**: Given Requester A is selected, when they navigate to My Tickets, then they only see tickets created by Requester A and none from Requester B.
- **AC-03**: Given a ticket with 5 active attachments, when the requester attempts to upload a 6th attachment, then the system rejects the upload and displays an error message.
- **AC-04**: Given an active attachment, when the requester soft-removes it, then the attachment is marked as removed in the database and can no longer be downloaded or previewed in the UI.
- **AC-05**: Given a missing required field (e.g., Summary), when the requester attempts to submit the Create Ticket form, then the submission is prevented and a red validation message appears immediately below the missing field.
- **AC-06**" (Performance): ระบบต้องดึงข้อมูล My Tickets ชุดแรก (Pagination limit 10) ได้ภายใน 2 วินาที
## 10. Definition of Done
- Implementation of all approved scope items is complete.
- All Acceptance Criteria are satisfied and verified by automated tests (Unit, API, UI, E2E).
- UI completely conforms to the Zen Green Theme and responsive design rules.
- Peer review is completed via Pull Request on GitHub.
- `docs/lab-02/specification.md`, `tests.md`, `ui-spec.md`, and `api-spec.md` are fully updated and match the implementation.

## 11. Assumptions and Decisions
- It is assumed that file uploads will be stored on the local file system (e.g., an `uploads` directory) for the scope of this lab, rather than a cloud storage bucket.
- The Development Requester selector will completely trust the client's provided `requesterId` in API headers or payloads, as actual secure token-based authentication is explicitly excluded from Lab 2.