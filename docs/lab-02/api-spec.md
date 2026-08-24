# Lab 2 API Specification

## 1. Reference Data
### `GET /api/requesters`
- **Purpose:** Retrieve active development requesters for the selection screen.
- **Response:** `200 OK` (Array of requester objects) | `500 Internal Server Error`

### `GET /api/categories`
- **Purpose:** Retrieve active ticket categories.
- **Response:** `200 OK` (Array of category objects)

### `GET /api/systems`
- **Purpose:** Retrieve active related systems.
- **Response:** `200 OK` (Array of related system objects)

## 2. Tickets
### `POST /api/tickets`
- **Purpose:** Create a new ticket for the selected requester.
- **Request Body:** `summary`, `description`, `categoryId`, `systemId`, `requestedPriority`, `requesterId`
- **Response:** `201 Created` (Returns created ticket with generated Ticket Number) | `400 Bad Request` (Validation errors)

### `GET /api/tickets`
- **Purpose:** Retrieve a paginated, filtered, and sorted list of tickets owned by the current requester.
- **Query Params:** `requesterId` (required), `search`, `categoryId`, `priority`, `status`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response:** `200 OK` (Pagination metadata + Array of tickets) | `401 Unauthorized` / `400 Bad Request` (If requesterId is missing)

### `GET /api/tickets/:id`
- **Purpose:** Retrieve one owned ticket.
- **Headers/Query:** Requires `requesterId` context to enforce ownership.
- **Response:** `200 OK` (Ticket object) | `404 Not Found` | `403 Forbidden` (Ownership validation failed)

## 3. Attachments
### `POST /api/tickets/:id/attachments`
- **Purpose:** Upload an attachment to an owned ticket. Max 5MB, allowed types: JPG, PNG, WEBP, PDF. Max 5 active attachments per ticket.
- **Request:** `multipart/form-data` with file payload.
- **Response:** `201 Created` | `400 Bad Request` (Invalid file type/size or exceeding limits)

### `GET /api/tickets/:id/attachments/:attachmentId/download`
- **Purpose:** Download an active attachment.
- **Response:** `200 OK` (File stream) | `404 Not Found` | `403 Forbidden` (If removed or ownership validation fails)

### `DELETE /api/tickets/:id/attachments/:attachmentId`
- **Purpose:** Soft-remove an attachment from an owned ticket.
- **Response:** `200 OK` (Attachment metadata marked as removed) | `404 Not Found`