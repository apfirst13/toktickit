# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Palette & Style Tokens
- **Primary green:** `#006B3C` (App header, primary actions, strong emphasis)
- **Secondary green:** `#0B7A46` (Active tabs, focus accents, links, hover states)
- **Pale green:** `#EAF6EF` (Selected, success, subtle section emphasis)
- **Page background:** `#F5F7F6` (Quiet near-white)
- **Surface / cards:** White with subtle border and restrained shadow
- **Text:** Dark charcoal-green (comfortable reading, not pure black)

## 2. Component Rules
- **Forms:** Labels appear above controls. Required fields show a red asterisk (`*`).
- **Inputs:** Editable fields have a white background and neutral border. Read-only fields use a distinct soft gray-green background.
- **Buttons:** Must include visible text. Submit button shows a busy state (disabled) while processing.
- **Validation:** Dark red text and border; messages appear immediately below the invalid field.

## 3. Screen Layouts
### 3.1 Development Requester Selection
- Displays TokTickIT title and explanation that this is for Lab 2 testing only.
- Dropdown of active requesters. Continue button with loading state.

### 3.2 Create Ticket Layout
- System-generated fields (Ticket Number, Date) are read-only.
- Classification fields are grouped. Summary and Description have sufficient width.
- Attachments section is placed logically below main fields.

### 3.3 My Tickets Layout
- Includes Search bar, Filters (Category, Priority, Status).
- List/Table columns: Ticket Number, Summary, Category, Priority, Status, Last Updated.
- Meaningful loading, empty, no-results, and failure states. Pagination at the bottom.

### 3.4 Requester Ticket Detail
- Read-only display of current Ticket information.
- Clear separation between ticket details and Attachment management actions.