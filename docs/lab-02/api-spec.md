# Lab 2 API Specification

## 1. Reference Data Endpoints
- `GET /api/requesters`: Retrieve active development requesters. Returns `200 OK` (Array).
- `GET /api/categories`: Retrieve active ticket categories. Returns `200 OK` (Array).
- `GET /api/systems`: Retrieve active related systems. Returns `200 OK` (Array).

## 2. Ticket Endpoints
### `POST /api/tickets`
- **Purpose:** Create a new ticket.
- **Body:** `{ summary, description, categoryId, systemId, requestedPriority, requesterId }`
- **Response:** `201 Created` (with generated ticketNumber) | `400 Bad Request` (Validation error).

### `GET /api/tickets`
- **Purpose:** Retrieve paginated tickets owned by the current requester.
- **Query Params:** `requesterId` (required), `search`, `categoryId`, `status`, `page`.
- **Response:** `200 OK` (Array of tickets + pagination metadata) | `400 Bad Request` (Missing requesterId).

### `GET /api/tickets/:id`
- **Purpose:** Retrieve specific ticket details.
- **Query Params:** `requesterId` (required for ownership check).
- **Response:** `200 OK` | `404 Not Found` | `403 Forbidden` (If owned by someone else).

## 3. Attachment Endpoints
### `POST /api/tickets/:id/attachments`
- **Purpose:** Upload an attachment (Max 5MB; JPG, PNG, WEBP, PDF). Max 5 per ticket.
- **Response:** `201 Created` | `400 Bad Request` (Limit exceeded, invalid type/size).

### `GET /api/tickets/:id/attachments/:attachmentId/download`
- **Purpose:** Download an active attachment.
- **Response:** `200 OK` (File stream) | `404 Not Found` | `403 Forbidden` (If removed or unauthorized).

### `DELETE /api/tickets/:id/attachments/:attachmentId`
- **Purpose:** Soft-remove an attachment.
- **Response:** `200 OK` (Metadata marked as removed) | `404 Not Found`.