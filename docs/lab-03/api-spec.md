# Lab 3 REST API Specification

## 1. Authentication
### `POST /api/auth/login`
- **Body:** `{ "email": "user@toktickit.com", "password": "Password123!" }`
- **Response 200:** `{ "user": { "id": 1, "email": "...", "fullName": "...", "role": "IT_STAFF", "mustChangePassword": false } }`
- **Response 401:** `{ "error": "Invalid email or password" }`

### `POST /api/auth/logout`
- **Headers:** Authorization Bearer token / Cookie
- **Response 200:** `{ "message": "Logged out successfully" }`

### `GET /api/auth/me`
- **Headers:** Authorization Bearer token / Cookie
- **Response 200:** `{ "user": { "id": 1, "email": "...", "fullName": "...", "role": "IT_STAFF", "mustChangePassword": false } }`
- **Response 401:** Unauthorized if not logged in.

### `POST /api/auth/change-password`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "currentPassword": "...", "newPassword": "..." }`
- **Response 200:** `{ "message": "Password changed successfully" }`
- **Response 400:** Validation failure or password reuse restriction.
- **Response 401:** Unauthorized.

## 2. IT Staff Queue & Ticket Operations
### `GET /api/staff/queue`
- **Role:** `IT_STAFF`, `ADMINISTRATOR` only. (Strictly blocks `REQUESTER` role).
- **Headers:** Authorization Bearer token / Cookie
- **Query Parameters:**
  - `page` (number, default: 1): Page number. Invalid non-numeric values fallback to default.
  - `limit` (number, default: 10, max: 50): Page size. Invalid or excessive values fallback to default.
  - `search` (string): Keyword matching `ticketNumber` or `summary`.
  - `category`, `status`, `requestedPriority`, `itPriority` (string): Exact match filters.
  - `assignedTo` (string): ID of staff, or `unassigned`.
  - `sortBy` (string, default: `createdAt`): Allowed whitelist (`createdAt`, `requestedPriority`, `itPriority`, `currentStatus`). Invalid values fallback to default.
  - `sortOrder` (string, default: `desc`): `asc` or `desc`.
- **Response 200:**
  ```json
  {
    "data": [...],
    "pagination": { "total": 87, "page": 1, "pageSize": 10, "totalPages": 9 }
  }
  ```
- **Response 401:** Unauthorized (No valid token provided).
- **Response 403:** Forbidden (If user is a Requester, since this endpoint does not apply ownership constraints, it must return 403, not 404).

### `GET /api/staff/users`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Response 200:** Array of active IT Staff and Administrators (`{ "id", "fullName", "role" }`) to be used for ticket assignment dropdowns.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for Requesters.

### `GET /api/tickets/:id`
- **Role:** `REQUESTER` (Owner only), `IT_STAFF`, `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Response 200:** Ticket detail object including attachments and comments.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden if Requester does not own the ticket.
- **Response 404:** Ticket not found.

### `PATCH /api/staff/tickets/:id`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "assignedStaffId": 2, "itPriority": "HIGH", "status": "IN_PROGRESS" }`
- **Response 200:** Updated ticket object.
- **Response 400:** Invalid status transition per lifecycle rules, or invalid assignment (inactive user/wrong role).
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for Requesters.

### `POST /api/tickets/:id/comments`
- **Role:** `REQUESTER` (Owner only), `IT_STAFF`, `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "content": "Public comment text", "appearsResolved": boolean (optional) }`
- **Response 201:** Comment object with author details.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden if Requester does not own the ticket.

### `GET /api/tickets/:id/notes`
- **Role:** `IT_STAFF`, `ADMINISTRATOR` (Strictly blocks Requesters with 403)
- **Headers:** Authorization Bearer token / Cookie
- **Response 200:** Array of internal note objects.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for Requesters.

### `POST /api/tickets/:id/notes`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "content": "Internal investigation note" }`
- **Response 201:** Note object.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for Requesters.

## 3. Administrator User Management
### `GET /api/admin/users`
- **Role:** `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Query:** `search`, `role`, `isActive`
- **Response 200:** Array of user records.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for non-Administrators.

### `POST /api/admin/users`
- **Role:** `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "email": "new@toktickit.com", "fullName": "...", "role": "IT_STAFF", "initialPassword": "..." }`
- **Response 201:** Created user with `mustChangePassword = true`.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for non-Administrators.
- **Response 409:** Email already in use.

### `PATCH /api/admin/users/:id`
- **Role:** `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "email": "...", "fullName": "...", "role": "...", "isActive": false }`
- **Response 200:** Updated user record.
- **Response 400:** Self-deactivation or last-admin deactivation blocked.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for non-Administrators.
- **Response 409:** Email already in use by another user.

### `POST /api/admin/users/:id/reset-password`
- **Role:** `ADMINISTRATOR`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "initialPassword": "..." }`
- **Response 200:** Password updated, `mustChangePassword` set to true.
- **Response 401:** Unauthorized.
- **Response 403:** Forbidden for non-Administrators.