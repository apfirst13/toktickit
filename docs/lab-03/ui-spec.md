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
- Header toolbar with Ticket Search input, Category dropdown, Priority filter (separate Requested vs IT Priority), Status filter, and Owner filter ("All", "Unassigned", "Assigned to Me" - where "Assigned to Me" automatically filters by the current authenticated user's JWT identity).
- Desktop (≥992px): Multi-column table (Ticket No, Created, Summary, Category, Req Priority, IT Priority, Status, Owner, Action).
- Tablet & Mobile (<992px): Stacked responsive card layout. Primary fields shown on cards: Ticket Number, Summary, Status Badge, and Priority Badge. Other fields expand or are available in detail view without horizontal scrolling.
- **Empty State:** Distinct placeholder UI when no tickets exist in the system at all.
- **No-Results State:** Distinct message shown when tickets exist but none match the current search/filter criteria. Must include a clear "Clear Filters" button to reset the query.

### 2.3 IT Staff Ticket Detail Screen
- Distinct visual separation between Ticket Metadata (editable fields marked with standard borders; read-only with pale green tint).
- Tabbed or split conversation view:
  - **Public Comments:** Standard message bubbles showing author, role badge, and timestamp.
  - **Internal Notes:** Golden-tinted container clearly labeled "Internal Operational Note - IT Staff Only".

### 2.4 Administrator User Management Screen
- Search bar by name or email, role filter dropdown, and "+ Create User" modal button.
- User table with Name, Email, Role badge, Status badge (Active/Inactive), and Edit action.
- Edit/Create drawer with input validation and clear confirmation when generating a temporary password.

### 2.5 Requester Ticket Detail (Updated)
- Integrates the new authenticated Requester identity, removing the old Development Requester selector.
- Retains existing Ticket and Attachment ownership protection.
- Adds an append-only Public Comment section visible to all permitted roles.
- Introduces a "Problem Appears Resolved" action button, allowing the Requester to indicate resolution without formally altering the IT status.

## 3. Responsive and Visual Checklist
- [ ] Desktop (≥992px): Centered layouts, table views unclipped.
- [ ] Tablet (768-991px): Adaptive grid collapse, legible typography.
- [ ] Mobile (<768px): Vertical stacking, touch-friendly hit areas (≥44px), zero horizontal overflow.
- [ ] Distinct styling between Public Comments and Internal Notes.

## 4. Screen Modes and Feedback States
- **Screen Modes:**
  - **Create Mode:** Empty forms ready for input (e.g., New Ticket, Create User).
  - **View Mode:** Read-only data presentation (e.g., Ticket Detail for non-owners, Public Comments).
  - **Edit Mode:** Interactive fields pre-populated with existing data (e.g., IT Staff updating priority, Admin editing user status).
- **Feedback States:**
  - **Loading:** Spinners or skeleton loaders during data fetch/submit operations.
  - **Saving & Success:** Brief disabled states during network requests followed by toast notifications (e.g., "User saved successfully").
  - **Validation:** Inline red text under fields failing business rules (e.g., "Password too short", "Invalid email").
  - **Empty/No-results:** Clear graphic or text when lists are empty (e.g., "No tickets match your filters").
  - **Forbidden (403):** Distinct UI feedback when attempting unauthorized actions.
  - **Not-found (404):** Dedicated page/message when a resource does not exist or belongs to another user.
  - **Conflict (409):** Inline or toast error when attempting duplicate creations (e.g., "Email already registered").
  - **Safe API-failure (500):** Generic error fallback (e.g., "Something went wrong, please try again later") without exposing stack traces.