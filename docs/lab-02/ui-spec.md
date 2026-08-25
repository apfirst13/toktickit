# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Palette & Typography
- **Primary green:** `#006B3C` (app header, primary actions, strong emphasis)
- **Secondary green:** `#0B7A46` (active tabs, focus accents, links, hover states)
- **Pale green:** `#EAF6EF` (selected, success, subtle section emphasis)
- **Page background:** `#F5F7F6`
- **Surface / cards:** White with subtle border and restrained shadow
- **Text:** Dark charcoal-green (not pure black)
- **Error:** Dark red text and border; messages appear immediately below the field
- **Warning:** Amber callout or badge
- **Success:** Green confirmation

## 2. Component Rules
- **Forms:** Labels appear above controls. Required fields show a red asterisk.
- **Inputs:** Editable fields use a white background with a clear neutral border. Read-only fields use a distinct soft gray-green background.
- **Buttons:** Include visible text. Submit buttons show a busy state and are disabled while processing.
- **Badges:** Consistent badge styles for Requested Priority, IT Priority, and Current Status.
Validation Behavior: ข้อความ Error จะแสดงขึ้นเมื่อผู้ใช้ย้าย Cursor ออกจากช่องพิมพ์ (onBlur) และจะมีการตรวจสอบฟอร์มทั้งหมดอีกครั้งเมื่อกดปุ่ม Submit (onSubmit) โดยข้อความ Error จะไม่หายไปเองจนกว่าผู้ใช้จะกรอกข้อมูลถูกต้อง

## 3. Responsive Layout Rules
- **Desktop (≥ 992px):** Multi-column layout as specified; content centered with a sensible maximum width.
- **Tablet (768 - 991px):** Two-column layout where practical; Summary and Description receive enough width.
- **Mobile (< 768px):** Fields stack vertically; buttons remain touch-friendly; no horizontal page scrolling.

## 4. Screen Specifications
### 4.1 Development Requester Selection
- Displays TokTickIT title and an explanation that this is for Lab 2 testing only (not real authentication).
- Dropdown containing active requesters.
- Continue button with a loading state. Meaningful empty/failure states supported.

### 4.2 Create Ticket Layout
- System-generated fields (e.g., Ticket Number) are read-only and distinct.
- Classification fields (Category, Related System, Priority) are grouped together logically.
- Attachments section is placed below the main input fields.

### 4.3 My Tickets Layout
- Includes search bar, filters (Category, Priority, Status), and sorting.
- List/Table columns: Ticket Number, Summary, Category, Priority, Status, Last Updated.
- Meaningful loading, empty, no-results, and failure states. Pagination controls at the bottom.

### 4.4 Requester Ticket Detail Layout
- Current Ticket information is read-only.
- Clearly distinguishes current Ticket information from Attachment actions.