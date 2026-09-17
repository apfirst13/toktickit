# Lab 3 Visual Inspection Checklist

## Methodology
Automated visual inspection using Playwright capturing 3 viewport sizes for 4 critical screens to verify Zen Green UI guidelines, responsiveness, and clipping constraints (AC-01).

- **Desktop**: 1280x720 (≥992px)
- **Tablet**: 768x1024 (768-991px)
- **Mobile**: 390x844 (<768px)

## Acceptance Criteria Checklist (VIS-01)

### 1. Authentication Security Alert
- [x] **Desktop:** Renders centered, alert box matches Zen layout, no text clipping.
- [x] **Tablet:** Margins adjust correctly, text is fully legible.
- [x] **Mobile:** Stacks perfectly within the 390px width. No horizontal scrolling.

### 2. IT Staff Queue
- [x] **Desktop:** Table layout spans correctly. Filters are side-by-side.
- [x] **Tablet:** Table scales down or columns adjust.
- [x] **Mobile:** Responsive card layout or scrollable table wrapper triggers gracefully.

### 3. IT Staff Ticket Detail & Internal Note
- [x] **Desktop:** Golden tint for internal notes is clearly visible and aligned.
- [x] **Tablet:** Layout margins constrain properly.
- [x] **Mobile:** Comment and internal note inputs stack vertically without overflowing.

### 4. Admin User Management
- [x] **Desktop:** Full user table and modal (Create/Edit) display cleanly.
- [x] **Tablet:** Table is scrollable horizontally or adapts.
- [x] **Mobile:** Inputs in modal span full width, table displays without breaking parent container.

## Screenshot Directory
Screenshots have been generated and committed to the repository at `artifacts/lab-03/screenshots/`.

**Status:** PASS 
**Verified By:** E2E Automated Visual Script (`e2e/lab-03/responsive.spec.ts`)
