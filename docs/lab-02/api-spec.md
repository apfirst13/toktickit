# Lab 2 API Specification

## 1. Reference Data

### `GET /api/requesters`
- **Purpose:** Retrieve active development requesters for the selection screen.
- **Response 200 OK:**
```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer@example.com",
    "department": "Engineering"
  }
]

[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" }
]

[
  { "id": 1, "name": "Email Server" },
  { "id": 2, "name": "ERP System" }
]

{
  "summary": "string (Required, Max 200 chars)",
  "description": "string (Required)",
  "categoryId": "number (Required, must exist in DB)",
  "systemId": "number (Required, must exist in DB)",
  "requestedPriority": "string (Required, Enum: 'Low', 'Medium', 'High')",
  "requesterId": "number (Required, must exist in DB)"
}

{
  "id": 123,
  "ticketNumber": "TIK-001",
  "summary": "Cannot access Email",
  "currentStatus": "New",
  "createdAt": "2026-08-25T10:00:00Z"
}

{
  "errors": [
    { "field": "summary", "message": "Summary is required and must not exceed 200 characters." },
    { "field": "requestedPriority", "message": "Invalid priority level." }
  ]
}


{
  "data": [
    {
      "id": 123,
      "ticketNumber": "TIK-001",
      "summary": "Cannot access Email",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "High",
      "currentStatus": "New",
      "updatedAt": "2026-08-25T10:00:00Z"
    }
  ],
  "meta": {
    "totalRecords": 45,
    "currentPage": 1,
    "totalPages": 5,
    "limit": 10
  }
}

{
  "errors": [
    { "field": "requesterId", "message": "Requester ID is required to fetch tickets." }
  ]
}

{
  "id": 1,
  "ticketNumber": "TIK-001",
  "summary": "Issue with VPN",
  "description": "Cannot connect to the corporate VPN from home.",
  "category": { "id": 4, "name": "Network" },
  "system": { "id": 3, "name": "VPN" },
  "currentStatus": "New",
  "requestedPriority": "High",
  "attachments": []
}

{
  "id": 10,
  "fileName": "screenshot-error.png",
  "originalName": "error.png",
  "size": 1024500,
  "url": "/uploads/screenshot-error.png"
}

{
  "errors": [
    { "field": "file", "message": "File exceeds the 5MB limit or invalid file type." }
  ]
}

{
  "message": "Attachment removed successfully.",
  "attachmentId": 10,
  "isRemoved": true
}{
  "message": "Attachment removed successfully.",
  "attachmentId": 10,
  "isRemoved": true
}