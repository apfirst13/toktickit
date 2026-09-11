# Lab 3 UI Specification (Zen Green Theme)

## 1. Design Tokens
- **Primary Green:** `#006B3C` (Headers, active tabs, primary buttons)
- **Secondary Green:** `#0B7A46` (Hover states, table action accents)
- **Pale Tint Background:** `#EAF6EF` (Read-only highlights, selected rows)
- **Neutral Surface:** `#FFFFFF` (Cards, dialog containers)
- **Base Background:** `#F5F7F6`
- **Error:** `#D92D20` (Validation messages, danger buttons)
- **Warning/Pending Badge:** `#F79009`
- **Success Badge:** `#039855`
- **Internal Note Callout:** Light amber/yellow tint (`#FFFBEB` with `#F59E0B` border) to explicitly contrast with Public Comments.

## 2. Screen Specifications
### 2.1 Login & Password Change Screen
- Center-aligned card container on Desktop/Tablet; full-width on Mobile.
- Explicit generic validation banner: "Invalid email or password" upon 401 response.
- Password change view enforces criteria checklist: Minimum 8 characters, uppercase, lowercase, numeric, and special character.

### 2.2 IT Staff Ticket Queue Screen
- Header toolbar with Ticket Search input, Category dropdown, Priority filter, and Status filter.
- Desktop (≥992px): Multi-column table (Ticket No, Created, Summary, Category, Req Priority, IT Priority, Status, Owner, Action).
- Tablet & Mobile (<992px): Stacked responsive card layout; preserves quick actions and ownership badges without horizontal scrolling.

### 2.3 IT Staff Ticket Detail Screen
- Distinct visual separation between Ticket Metadata (editable fields marked with standard borders; read-only with pale green tint).
- Tabbed or split conversation view:
  - **Public Comments:** Standard message bubbles showing author, role badge, and timestamp.
  - **Internal Notes:** Golden-tinted container clearly labeled "Internal Operational Note - IT Staff Only".

### 2.4 Administrator User Management Screen
- Search bar by name or email, role filter dropdown, and "+ Create User" modal button.
- User table with Name, Email, Role badge, Status badge (Active/Inactive), and Edit action.
- Edit/Create drawer with input validation and clear confirmation when generating a temporary password.

## 3. Responsive and Visual Checklist
- [ ] Desktop (≥992px): Centered layouts, table views unclipped.
- [ ] Tablet (768-991px): Adaptive grid collapse, legible typography.
- [ ] Mobile (<768px): Vertical stacking, touch-friendly hit areas (≥44px), zero horizontal overflow.
- [ ] Distinct styling between Public Comments and Internal Notes.