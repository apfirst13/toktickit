# Lab 4 Peer Review & Code Review Log

เอกสารนี้รวบรวมประวัติการทำ Cross-project Peer Review, ตารางการตรวจสอบ Pull Request ทุกชุด, และข้อเสนอแนะที่ได้รับจากผู้ตรวจประเมินในระหว่างการทำงาน **Lab 4 (TokTickIT - Sprint 2: Actions Taken, Dashboards, and Final Regression)**

---

## 1. ข้อมูลผู้จัดทำและผู้รีวิว (Reviewer & Author Information)

* **ผู้พัฒนา (Author):** นายอภิวัฒน์ พันธ์ทธนพัทธ์ (Aphiwat Panthathanaphat)
* **รหัสนักศึกษา (Student ID):** 67070507209
* **ผู้ตรวจประเมิน (Peer Reviewer):** ธีรวัฒน์ (Theerawat)
* **GitHub Reviewer Handle:** `@Theerawat82`
* **Repository URL:** [https://github.com/apfirst13/toktickit](https://github.com/apfirst13/toktickit)
* **Project Board (Kanban):** [https://github.com/users/apfirst13/projects/3/views/1](https://github.com/users/apfirst13/projects/3/views/1)

---

## 2. ตารางสรุป Pull Requests ทั้งหมดใน Lab 4 (Reviewed Pull Requests)

*(รวบรวม PR ทั้งหมดที่ผ่านการ Review, ตรวจสอบ และ Merge เข้าสู่ branch `lab4-staging` และ `main` ตามแนวทาง Engineering Workflow)*

| Issue / หัวข้อ | Branch Name | คำอธิบายงาน (Scope & Description) | PR Link | สถานะการ Review |
|:---|:---|:---|:---|:---|
| **Issue 1** | `feat/lab4-01-foundation` | Spec DD, Test DD, DB Migration `add_actions_taken`, Seed Data | [#71](https://github.com/apfirst13/toktickit/pull/71) | ✅ Approved & Merged |
| **Issue 2** | `feat/lab4-02-actions-api` | Actions Taken REST API, Validation, Optimistic Concurrency | [#72](https://github.com/apfirst13/toktickit/pull/72) | ✅ Approved & Merged |
| **Issue 3** | `feat/lab4-03-actions-ui` | Actions Taken UI (List, Create/Edit Form, Timezone) | [#73](https://github.com/apfirst13/toktickit/pull/73) | ✅ Approved & Merged |
| **Issue 4** | `feat/lab4-04-ticket-workflow` | Ticket Workflow, Resolution Gate BR-01, State Transitions | [#74](https://github.com/apfirst13/toktickit/pull/74) | ✅ Approved & Merged |
| **Issue 5** | `feat/lab4-05-requester-dashboard` | Requester Dashboard, Metrics Cards, Drill-down Linkage | [#75](https://github.com/apfirst13/toktickit/pull/75) | ✅ Approved & Merged |
| **Issue 6** | `feat/lab4-06-staff-dashboard` | IT Staff Dashboard, Queue Metrics, Urgent Priority Formula | [#76](https://github.com/apfirst13/toktickit/pull/76) | ✅ Approved & Merged |
| **Issue 7a** | `feat/lab4-07a-cp2-fixes` | Checkpoint 2 Fixes: Incomplete Vertical Slice & Drill-down Sync | [#77](https://github.com/apfirst13/toktickit/pull/77) | 🔄 Request Change ➔ ✅ Approved |
| **Issue 7b** | `feat/lab4-07b-hardening` | Visual & Regression Hardening: Title Case Badges, Dropdowns | [#78](https://github.com/apfirst13/toktickit/pull/78) | 🔄 Request Change ➔ ✅ Approved |
| **Issue 8** | `feat/lab4-08-release` | Release Integration, Visual Inspection, Responsive Verification | [#79](https://github.com/apfirst13/toktickit/pull/79) | ✅ Approved & Merged |
| **Hotfix 1** | `fix/lab4-08-a11y` | Accessibility: Focus Rings, ARIA labels, Contrast Hardening | [#81](https://github.com/apfirst13/toktickit/pull/81) | ✅ Approved & Merged |
| **Hotfix 2** | `fix/lab4-form-hardening` | Form Hardening: Double-click Guard (`isSubmittingRef`) | [#82](https://github.com/apfirst13/toktickit/pull/82) | 🔄 Request Change ➔ ✅ Approved |
| **Sync/Chore** | `chore/lab4-submission-fixes` | Directory Layout & Submission Evidence Alignment | [#83](https://github.com/apfirst13/toktickit/pull/83) | ✅ Approved & Merged |
| **Staging Merge** | `lab4-staging` | **Sprint 4 Staging Release Merge to `main`** | [#84](https://github.com/apfirst13/toktickit/pull/84) | ✅ Approved & Merged |
| **Artifacts** | `chore/final-artifacts` | Final Test Outputs, Test Logs, Evidence Screenshots | [#85](https://github.com/apfirst13/toktickit/pull/85) | ✅ Approved & Merged |
| **Sync** | `sync/main-to-staging` | Sync documentation and artifacts back to staging branch | [#86](https://github.com/apfirst13/toktickit/pull/86) | ✅ Approved & Merged |
| **Docs Backfill** | `docs/lab4-spec-ac-backfill` | Client Unit Test Suite Backfill (67 tests) & Traceability | [#87](https://github.com/apfirst13/toktickit/pull/87) | ✅ Approved & Merged |
| **Invariant Fix** | `fix/lab4-urgent-drilldown-and-responsive` | Rule 13 Invariant: Terminal status exclusion on Urgent filter | [#90](https://github.com/apfirst13/toktickit/pull/90) | ✅ Approved & Merged |
| **E2E Tests** | `test/lab4-e2e-scenarios` | Comprehensive End-to-End Scenarios for Lab 4 Flows | [#91](https://github.com/apfirst13/toktickit/pull/91) | ✅ Approved & Merged |
| **Final Merge** | `lab4-staging` | **Sprint 4 Final Release to `main` (Verified 100% Pass)** | [#92](https://github.com/apfirst13/toktickit/pull/92) | ✅ Approved & Merged |

---

## 3. สรุปข้อเสนอแนะและการรีวิวที่สำคัญใน Lab 4 (Detailed Review Log)

### Iteration 1: PR #77 — Issue 7a: Staff Dashboard Open Card Drill-down Sync
* **Pull Request:** [https://github.com/apfirst13/toktickit/pull/77](https://github.com/apfirst13/toktickit/pull/77)
* **ผู้รีวิว:** `Theerawat82`
* **สถานะการรีวิว:** Request Changes ➔ Resolved & Approved
* **Feedback จากผู้รีวิว:**
  1. **Incomplete Vertical Slice:** Backend มีการนับรวมสถานะ `REOPENED` เข้าไปในการ์ด "Open" (`STAFF_OPEN_STATUSES`) ตาม Business Rule แล้ว แต่ที่หน้าบ้าน `StaffDashboard.tsx` ลิงก์ Drill-down ยังส่งค่า query string เก่าคือ `?status=OPEN`
  2. ทำให้เมื่อผู้ใช้กดการ์ด "Open" เข้าไปดูหน้ารายการคิว ตั๋วสถานะ `REOPENED` จะไม่ปรากฏ ยอดรวมตั๋วที่เห็นในตารางจึงไม่ตรงกับตัวเลขบนการ์ด Dashboard เกิดข้อบกพร่องด้าน Data Invariant
* **การแก้ไขโดย Developer:**
  - นำเข้าค่าคงที่ `STAFF_OPEN_STATUSES = ['OPEN', 'REOPENED']` มาใช้เป็น Single Source of Truth ร่วมกันระหว่าง Client และ Server
  - ปรับลิงก์ Drill-down บนการ์ดให้ส่ง `status=OPEN,REOPENED` ไปยังหน้าคิวงาน
  - อัปเดต `ticket-query.util.ts` ให้รองรับการค้นหาแบบ Comma-separated statuses
  - เพิ่ม Unit Test และ API Invariant Test ยืนยันว่าค่าตัวเลขบนการ์ดตรงกับยอดในคิวงาน 100%
* **ผลลัพธ์:** ผู้รีวิวตรวจสอบความถูกต้องและกด **Approve**

---

### Iteration 2: PR #78 — Issue 7b: Regression & Visual Hardening
* **Pull Request:** [https://github.com/apfirst13/toktickit/pull/78](https://github.com/apfirst13/toktickit/pull/78)
* **ผู้รีวิว:** `Theerawat82`
* **สถานะการรีวิว:** Request Changes ➔ Resolved & Approved
* **Feedback จากผู้รีวิว:**
  1. **Drill-down UI Desync:** เมื่อผู้ใช้กดมาจาก Dashboard ด้วยค่า Filter รวม (เช่น `OPEN,REOPENED`) ตัวเลือกใน `<select>` ดรอปดาวน์ของหน้าคิวงานแสดงค่าว่างเปล่า เพราะใน `<option>` ไม่มี value ที่ตรงกับค่านั้น
  2. **Raw Enum Display:** ตรวจพบบั๊กการแสดงผลตัวอักษรดิบ เช่น `IN_PROGRESS`, `WAITING_FOR_REQUESTER` โผล่บน Status Badge เนื่องจากตอนแยกคอมโพเนนต์ลืมฟังก์ชัน Format ข้อความ
  3. **Priority Casing Inconsistency:** พบว่าตัวพิมพ์ใน Priority Badge ไม่สม่ำเสมอ โดยฝั่ง Requester ส่งมาเป็น PascalCase (`High`) ขณะที่ IT Staff ส่งมาเป็น UPPERCASE (`HIGH`)
* **การแก้ไขโดย Developer:**
  - เพิ่ม `<option value="OPEN,REOPENED">Open & Reopened</option>` ลงใน Filter Dropdown ของทั้งหน้า Requester และ Staff
  - สร้าง Utility function `formatText()` ใน `Badges.tsx` เพื่อแปลงเครื่องหมาย Underscore เป็นวรรค และแปลงเป็น Title Case ให้สม่ำเสมอทุกจุด
  - ปรับปรุงการตรวจสอบ Priority Badge ให้รองรับทั้งตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ พร้อมแปลงเป็นค่ามาตรฐานก่อนแสดงผล
* **ผลลัพธ์:** ผู้รีวิวตรวจสอบความถูกต้องและกด **Approve**

---

### Iteration 3: PR #82 — Form Hardening & Double-click Guard
* **Pull Request:** [https://github.com/apfirst13/toktickit/pull/82](https://github.com/apfirst13/toktickit/pull/82)
* **ผู้รีวิว:** `Theerawat82`
* **สถานะการรีวิว:** Request Changes ➔ Resolved & Approved
* **Feedback จากผู้รีวิว:**
  1. ในฟอร์มสร้าง Actions Taken มีการประกาศ `const isSubmittingRef = useRef(false);` ไว้แล้ว แต่ในฟังก์ชัน `handleSubmit` กลับไม่ได้เขียนโค้ดตรวจสอบค่า `isSubmittingRef.current` ก่อนเริ่มส่งคำขอ
  2. หากผู้ใช้ดับเบิลคลิกปุ่ม "Add Action" เร็วระดับ Millisecond คำขอจะหลุดไปสร้าง Record ซ้ำซ้อนในฐานข้อมูลได้
* **การแก้ไขโดย Developer:**
  - เพิ่ม Guard Check `if (isSubmittingRef.current) return; isSubmittingRef.current = true;` ที่บรรทัดแรกสุดของ `handleSubmit` และคืนค่าเป็น `false` ในบล็อก `finally`
  - ทำ Disable ที่ปุ่ม Submit ทันทีที่ถูกกด (`disabled={isSubmitting}`)
  - เขียน Playwright / E2E Automated Test ทดสอบการกดปุ่มรัวๆ 4 ครั้งติดกัน (Quadruple clicks) เพื่อยืนยันว่ามี Record ถูกสร้างขึ้นเพียง 1 รายการเท่านั้น
* **ผลลัพธ์:** ผู้รีวิวตรวจสอบความถูกต้องและกด **Approve**

---

### Iteration 4: PR #90 — Rule 13 Invariant: Urgent Priority Metric Synchronization
* **Pull Request:** [https://github.com/apfirst13/toktickit/pull/90](https://github.com/apfirst13/toktickit/pull/90)
* **ผู้รีวิว:** `Theerawat82`
* **สถานะการรีวิว:** Approved
* **Feedback จากผู้รีวิว:**
  - ตามสเปก Lab 4 (Section 4) กำหนดว่า Urgent Tickets คือตั๋วที่มีความสำคัญเป็น `URGENT` หรือ `HIGH` ที่ยังไม่ปิดงาน (ต้องไม่นับ `RESOLVED`, `CLOSED`, `CANCELLED`)
  - โค้ดใน `dashboard.controller.ts` ตัดสถานะจบงานออกถูกต้องแล้ว แต่ในฟังก์ชัน `buildTicketWhereClause` ที่หน้าคิวดึงข้อมูล ลืมตัดสถานะจบงานออก ทำให้เมื่อทดสอบรันในฐานข้อมูลที่มีตั๋วเก่า ตัวเลขฝั่งคิวงานได้ 17 แต่ Dashboard ได้ 12
* **การแก้ไขโดย Developer:**
  - แก้ไข `server/src/utils/ticket-query.util.ts` ให้ตัดสถานะ `RESOLVED`, `CLOSED`, `CANCELLED` ออกโดยอัตโนมัติเมื่อมีการกรอง `isUrgent`
  - เพิ่ม Unit Test ใน `ticket-query.util.test.ts` เพื่อป้องกัน Regression
  - ผลการรัน Vitest ใน Backend ผ่านครบ 82 ข้อ 100%
* **ผลลัพธ์:** ผู้รีวิวตรวจสอบความถูกต้องและกด **Approve**

---

## 4. หลักฐานการทำ Peer Review (Review Evidence Screenshots)

*(ตัวอย่างภาพหลักฐานการ Request Changes, การสื่อสารอภิปรายแนวทางแก้ไข และการกด Approve บน GitHub Pull Request)*

### ตัวอย่างที่ 1: การขอให้แก้ไข (Request Changes) และการ Approve ใน PR #77
![Review Request Changes PR 77](./images/review-pr77-request-changes.png)
*รูปที่ 4.1: ผู้รีวิวแจ้งจุดบกพร่องเรื่องความไม่สอดคล้องของตัวเลขบนการ์ด Open กับผลลัพธ์ในหน้า Queue*

![Review Approve PR 77](./images/review-pr77-approve.png)
*รูปที่ 4.2: ผู้รีวิวตรวจสอบโค้ดที่แก้ไขด้วย Single Source of Truth Constant และกด Approve*

### ตัวอย่างที่ 2: การตรวจพบ Double-click Guard ใน PR #82
![Review Request Changes PR 82](./images/review-pr82-request-changes.png)
*รูปที่ 4.3: ผู้รีวิวแจ้งเตือนจุดเสี่ยง Concurrency ของ `isSubmittingRef` ที่ยังไม่ได้นำไปใช้จริง*

![Review Approve PR 82](./images/review-pr82-approve.png)
*รูปที่ 4.4: ผู้พัฒนาเพิ่ม Guard และ E2E Test พร้อมได้รับการ Approve จากผู้รีวิว*

---

## 5. บทสรุปและบทเรียนจากการทำ Peer Review (Key Takeaways)

1. **การป้องกัน Silent Failures:** กระบวนการ Peer Review ช่วยให้ค้นพบข้อบกพร่องที่ Automated Test บางประเภทตรวจจับไม่ได้ เช่น การส่ง Query String ถูกต้องแต่ Dropdown หน้า UI ไม่ยอมเลือกค่าให้ หรือการตกหล่นของ Guard ตัวแปรแบบ Ref
2. **การรักษาความสมมาตรของระบบ (Data Consistency across Surfaces):** การตรวจทานอย่างละเอียดช่วยรักษา Business Rules และ Invariants ของทั้ง 3 Roles (Requester, IT Staff, Admin) ให้มีมาตรฐานข้อมูลเดียวกัน ไม่เกิดความสับสนของผู้ใช้งานจริง
3. **วัฒนธรรม Engineering ที่เข้มแข็ง:** การมี Gate เช็คก่อน Merge ทุก PR ช่วยให้โค้ดบน `lab4-staging` และ `main` สะอาด มี Migration ครบถ้วน และผ่านการทดสอบแบบ Regression ทั้งหมด 149 Automated Tests ก่อนส่งมอบงานจริง