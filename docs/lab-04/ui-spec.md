# Lab 4 - UI Specification

## 1. Ticket Detail View (Actions Taken Integration)

### Location
Added as a new tab or distinct visual section within the existing Ticket Detail page, clearly separated from Public Comments and Internal Notes.

### States & Modes
- **Read-only Mode**: Displays a list or table of actions taken. Each row shows Date, Description, Result, Performed By, and Follow-up details.
- **Create Mode**: A form to add a new action. Visible only to IT Staff and Administrators.
- **Edit Mode**: An inline or modal form to edit an existing action. Visible only to IT Staff and Administrators.

### Interactions & Validation
- **Conditional Field**: The "Follow-up Note" input is disabled or hidden until the "Follow-up Required" checkbox is ticked. Once ticked, it becomes a required field visually (client-side validation).
- **Duplicate-click Protection**: The "Save" or "Submit" button for actions taken must disable while the request is in flight to prevent duplicate submissions.

## 2. Requester Dashboard

### Metrics Display
- Rendered as clickable cards or tiles at the top of the home page for Requesters.
- Cards: "My Open", "In Progress", "Resolved", "Closed", "Recently Updated (7 Days)".
- Clicking a card navigates to the ticket list page with predefined filters applied (e.g., `?status=NEW,OPEN`).

## 3. IT Staff / Administrator Dashboard

### Metrics Display
- Rendered as clickable cards or tiles at the top of the home page for IT Staff and Administrators.
- Cards: "New", "Open", "In Progress", "Waiting for Requester", "My Assigned", "Urgent Tickets".
- Clicking a card navigates to the staff queue with predefined filters applied.

## 4. Shared UI Principles

- **Responsive Design**: All dashboard cards and the Actions Taken list must scale properly across 3 breakpoints (Mobile, Tablet, Desktop) without overlap or clipping.
- **Empty States**: If a metric is 0, the card remains clickable but visually indicates zero. The ticket list shows a helpful "No tickets found" message.
- **Accessibility**: All buttons, inputs, and semantic status cues (e.g., color for Urgent) must have proper aria-labels and keyboard focus handling.
