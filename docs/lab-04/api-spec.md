# Lab 4 - API Specification

## 1. Actions Taken API

### `GET /api/tickets/:id/actions`
- **Description**: Fetch all actions taken for a specific ticket.
- **Roles**: REQUESTER (if owner), IT_STAFF, ADMINISTRATOR
- **Response**: Array of `ActionTaken` objects including `performedBy` details.

### `POST /api/tickets/:id/actions`
- **Description**: Add a new action taken to a ticket.
- **Roles**: IT_STAFF, ADMINISTRATOR
- **Body**:
  - `actionDateTime`: ISO string
  - `description`: String
  - `result`: String
  - `followUpRequired`: Boolean
  - `followUpNote`: String (Optional, but required if `followUpRequired` is true)
  - `attachmentNotes`: String (Optional)
- **Validation**: 
  - `followUpNote` must not be empty if `followUpRequired` is true (400 Bad Request).
  - Ticket must exist (404 Not Found).
  - Role must be authorized (403 Forbidden).

### `PATCH /api/tickets/:id/actions/:actionId`
- **Description**: Edit an existing action taken.
- **Roles**: IT_STAFF, ADMINISTRATOR
- **Body**: Same as POST, plus:
  - `version`: Integer (Required for optimistic concurrency control).
- **Validation**:
  - `version` must match the current version in DB (409 Conflict).
  - Same validations as POST.

## 2. Dashboard API

### `GET /api/dashboard/requester`
- **Description**: Fetch dashboard metrics for the current requester.
- **Roles**: REQUESTER
- **Response**:
  - `myOpen`: Int
  - `inProgress`: Int
  - `resolved`: Int
  - `closed`: Int
  - `recentlyUpdated`: Int

### `GET /api/dashboard/staff`
- **Description**: Fetch dashboard metrics for IT Staff / Administrators.
- **Roles**: IT_STAFF, ADMINISTRATOR
- **Response**:
  - `new`: Int
  - `open`: Int
  - `inProgress`: Int
  - `waitingForRequester`: Int
  - `myAssigned`: Int
  - `urgentTickets`: Int
