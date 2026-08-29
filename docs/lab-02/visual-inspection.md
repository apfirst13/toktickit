# Visual Inspection Checklist - TokTickIT Lab 2

This document provides a checklist for manually verifying the responsive UI against the Zen Green Theme (`#006B3C`).

## Zen Green Theme Compliance
- [ ] Primary buttons use `#006B3C` as the background color.
- [ ] Primary buttons have legible white text.
- [ ] Section headers or main titles use the `#006B3C` color for text or borders (e.g., top border of cards).
- [ ] Active tabs or navigation elements highlight using `#006B3C`.
- [ ] Success states, while generally Bootstrap's default green, should not clash awkwardly with the Zen Green theme.
- [ ] The overall aesthetic maintains a clean, professional "Zen" feel.

## Responsive UI - Desktop (>= 992px)
- [ ] **Requester Selection:** The dropdown and continue button are clearly visible and well-aligned in the center or within a reasonable container width.
- [ ] **Create Ticket Form:** 
  - Summary and Description fields span the full width of their container.
  - Category, Related System, and Priority fields sit side-by-side (e.g., 3 columns, `col-md-4`).
- [ ] **My Tickets List:** 
  - The table is fully visible without horizontal scrolling (unless the screen is artificially narrowed).
  - Columns (Ticket Number, Summary, Status, Created, Action) have appropriate spacing.
- [ ] **Ticket Detail View:** 
  - Header info (Ticket Number, Status/Priority badges) is split correctly (number on left, badges on right).
  - Summary and Created At date are split logically (`col-md-8` and `col-md-4`).
  - Category, System, and Priority are displayed side-by-side in 3 columns.
  - Attachment upload form is displayed inline with appropriate column widths for inputs and button.

## Responsive UI - Tablet (>= 768px and < 992px)
- [ ] Layout remains similar to Desktop, utilizing `col-md-*` classes. 
- [ ] Form fields and detail columns should still fit comfortably side-by-side without overlapping or excessive squishing.
- [ ] Table in "My Tickets" remains legible.

## Responsive UI - Mobile (< 768px)
- [ ] **General:** No horizontal scrolling is required to view main content.
- [ ] **Create Ticket Form:** 
  - All form fields (Category, Related System, Priority) stack vertically (`col-12`).
  - Submit button spans the full width of the container.
- [ ] **My Tickets List:** 
  - Table is wrapped in a `.table-responsive` container, allowing horizontal scrolling *only* within the table area if necessary, preserving the main page layout.
- [ ] **Ticket Detail View:** 
  - Header info (Ticket Number, Badges) stacks or remains compact but readable.
  - Summary and Created At stack vertically.
  - Category, System, and Priority stack vertically (`col-12`).
  - Attachment upload form fields stack vertically (File input, mock URL if applicable, Upload button).
  - Attachment list items wrap text correctly and buttons remain accessible.

## Interactions & States
- [ ] **Loading States:** Spinners or loading text are visible and centered during data fetches.
- [ ] **Error States:** Alert banners are clearly styled (e.g., Bootstrap `alert-danger` or `alert-warning`) and legible.
- [ ] **Validation Messages:** Red invalid feedback text appears below the respective inputs when submitting an empty or invalid form.
- [ ] **Hover States:** Buttons and table rows show appropriate visual feedback on hover.
