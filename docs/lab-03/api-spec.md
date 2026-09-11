# Lab 3 REST API Specification

## 1. Authentication
### `POST /api/auth/login`
- **Body:** `{ "email": "user@toktickit.com", "password": "Password123!" }`
- **Response 200:** `{ "user": { "id": 1, "email": "...", "fullName": "...", "role": "IT_STAFF", "mustChangePassword": false } }`
- **Response 401:** `{ "error": "Invalid email or password" }`

### `POST /api/auth/logout`
- **Response 200:** `{ "message": "Logged out successfully" }`

### `POST /api/auth/change-password`
- **Headers:** Authorization Bearer token / Cookie
- **Body:** `{ "currentPassword": "...", "newPassword": "..." }`
- **Response 200:** `{ "message": "Password changed successfully" }`
- **Response 400:** Validation failure or password reuse restriction.

## 2. IT Staff Queue & Ticket Operations
### `GET /api/staff/queue`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Query:** `page`, `limit`, `search`, `category`, `status`, `priority`, `sortBy`, `sortOrder`
- **Response 200:** `{ "data": [...], "meta": { "total": 87, "page": 1, "totalPages": 9 } }`
- **Response 403:** Forbidden for Requesters.

### `PATCH /api/staff/tickets/:id`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Body:** `{ "assignedStaffId": 2, "itPriority": "HIGH", "status": "IN_PROGRESS" }`
- **Response 200:** Updated ticket object.
- **Response 400:** Invalid status transition per lifecycle rules.

### `POST /api/tickets/:id/comments`
- **Role:** `REQUESTER` (Owner only), `IT_STAFF`, `ADMINISTRATOR`
- **Body:** `{ "content": "Public comment text" }`
- **Response 201:** Comment object with author details.

### `GET /api/tickets/:id/notes`
- **Role:** `IT_STAFF`, `ADMINISTRATOR` (Strictly blocks Requesters with 403)
- **Response 200:** Array of internal note objects.

### `POST /api/tickets/:id/notes`
- **Role:** `IT_STAFF`, `ADMINISTRATOR`
- **Body:** `{ "content": "Internal investigation note" }`
- **Response 201:** Note object.

## 3. Administrator User Management
### `GET /api/admin/users`
- **Role:** `ADMINISTRATOR`
- **Query:** `search`, `role`, `isActive`
- **Response 200:** Array of user records.

### `POST /api/admin/users`
- **Role:** `ADMINISTRATOR`
- **Body:** `{ "email": "new@toktickit.com", "fullName": "...", "role": "IT_STAFF", "initialPassword": "..." }`
- **Response 201:** Created user with `mustChangePassword = true`.
- **Response 409:** Email already in use.

### `PATCH /api/admin/users/:id`
- **Role:** `ADMINISTRATOR`
- **Body:** `{ "fullName": "...", "role": "...", "isActive": false }`
- **Response 200:** Updated user record.
- **Response 400:** Self-deactivation or last-admin deactivation blocked.