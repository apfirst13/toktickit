# AI Assistance Log & Reflection (Lab 4)

## 1. LLM Tools Used
1. **Claude 3.5 Sonnet / Opus (Anthropic):** ทำหน้าที่เป็น Specification Architect, Test Plan Auditor, และ Peer Reviewer สำหรับตรวจทานโค้ด วิเคราะห์ช่องโหว่ Edge Cases และประเมินคะแนนตามเกณฑ์ Labsheet
2. **Google Antigravity / Gemini 1.5 Pro (Google DeepMind):** ทำหน้าที่เป็น Full-Stack Coding Agent, Test Automation Engineer (Vitest & Playwright), Database Migration/Seeding, และ Automated Evidence Capture

---

## 2. Key Prompts Table (10 Prompts)

| No. | Tool / Role | Purpose | Actual Prompt Summary | Output Quality & Action Taken |
|:---:|:---:|:---|:---|:---|
| 1 | Claude | Specification & Traceability | "ช่วยตรวจทาน `specification.md` และ `tests.md` ว่าครอบคลุม Functional Requirements, Business Rules BR-01..10, และ Acceptance Criteria AC-01..07 ครบถ้วนตามโจทย์ Lab 4 หรือไม่" | Claude วิเคราะห์และชี้จุดบกพร่องเรื่องการขาด AC Mapping และแนะนำโครงสร้าง Traceability Matrix ให้เชื่อมโยงกับ Automated Tests บน `main` ทุกข้อ |
| 2 | Antigravity | Full-Stack Feature Execution | "เริ่มทำ Issue 5 (Requester Dashboard) โดยยึดตาม LAB4_sheet.md ขอแบบ Full-stack ตั้งแต่ API จนถึง UI และรันเทสต์ด้วย" | AI สร้าง Endpoint `/api/dashboard/requester`, สร้าง Component `RequesterDashboard.tsx`, ผูก State และเขียน Vitest ครบทั้ง Client และ Server |
| 3 | Claude | Concurrency & Integrity Audit | "ตรวจทาน PR #82 เรื่อง Form Hardening และ Double-click Protection ว่ามีจุดเสี่ยง Concurrency หรือไม่" | Claude ตรวจพบว่าโค้ดมีการประกาศตัวแปร `isSubmittingRef` ไว้ แต่ใน `handleSubmit` ไม่ได้นำไปเช็ค guard จริง ทำให้ผู้ใช้ยังกดรัวได้ จึงแนะนำให้เพิ่ม Early Return Guard |
| 4 | Antigravity | Rapid Double-Click Guard | "เพิ่ม Guard ใน `ActionTakenForm.tsx` และ `CreateTicket.tsx` โดยใช้ `isSubmittingRef` ป้องกันการกด Submit ซ้ำขณะกำลังส่งข้อมูล พร้อมเขียน E2E Test พิสูจน์" | AI อัปเดต `ActionTakenForm.tsx` นำ `isSubmittingRef` มาบล็อกคำขอก่อนเรียก `onSubmit` พร้อมเขียน Playwright E2E ทดสอบ rapid clicks สำเร็จ |
| 5 | Antigravity | Bug Catching (AI Tunnel Vision) | "ลืมแก้ Frontend ฝั่ง Staff! ตอนนี้แก้ Backend ให้นับรวม REOPENED ไปแล้ว แต่ในหน้าจอ UI นายลืมอัปเดต Filter" | AI ยอมรับอาการ Tunnel Vision ที่มัวแต่แก้ Backend ให้เทสต์ผ่าน จึงตามไปอัปเดต Dropdown Options ใน `StaffDashboard.tsx` และ `StaffTicketQueue.tsx` ให้ตรงกัน |
| 6 | Antigravity | Resolution Gate Constraint | "ทำตาม BR-01: ตั๋วสถานะ IN_PROGRESS ที่ไม่มี Action Taken ห้ามเปลี่ยนสถานะเป็น RESOLVED โดยเด็ดขาด ต้องส่ง 400 Bad Request และ UI ต้อง Disable ตัวเลือก" | AI เพิ่ม Middleware และ Controller Guard ใน `staff.controller.ts` และกรอง Dropdown ใน `TicketDetail.tsx` ไม่ให้มีตัวเลือก RESOLVED หากไม่มีประวัติการปฏิบัติงาน |
| 7 | Antigravity | Timezone Distortion Fix | "ตรวจพบว่า Actions Taken แสดงเวลา 10:49 AM ขณะที่ Public Comments แสดงเวลา 5:49 PM ของเวลาเดียวกัน หาวิธีแก้ปัญหา Timezone Offset ไม่ให้บิดเบือน" | AI ปรับฟังก์ชัน `getLocalDatetimeLocal()` ใน `ActionTakenForm.tsx` โดยดึงค่า Year, Month, Date, Hours, Minutes ตาม Local Clock โดยตรง ไม่ผ่านการคำนวณ Offset ซ้ำซ้อน ทำให้เวลาแสดงผลตรงกันเป๊ะ |
| 8 | Claude & Antigravity | Urgent Drill-down Logic | "ทำไมคลิกการ์ด Urgent บน Staff Dashboard ที่แสดงเลข 2 แต่พอกดเข้าไปใน Queue กลับขึ้นตั๋วทั้งหมด 10 ใบ?" | Claude ชี้จุดว่าใน Query Builder ขาดการส่ง `isUrgent=true` และไม่ตัดสถานะ Terminal (RESOLVED/CLOSED) ออก Antigravity จึงแก้ `StaffTicketQueue.tsx` และ `ticket-query.util.ts` ให้คืนค่า 2 แถวตรงกับการ์ด |
| 9 | Antigravity | Concurrency Stale Update (409) | "จำลองสถานการณ์ Concurrency 409 Conflict ใน UI เมื่อเจ้าหน้าที่ 2 คนเปิดตั๋วใบเดียวกัน แล้วบันทึกเปลี่ยนสถานะชนกัน" | AI เขียน E2E Test จำลอง 2 Browser Contexts ยืนยันการแสดงแถบเตือนสีเหลือง `ตั๋วนี้ถูกเปลี่ยนสถานะโดยผู้ใช้อื่น...` โดยไม่ล้างข้อมูลฟอร์มที่ผู้ใช้พิมพ์ค้างไว้ |
| 10 | Antigravity | Automated Visual Audit | "สร้าง Playwright Spec ทำการตรวจวัด Visual Overflow, Focus Rings, Accessible Labels, และ WCAG Contrast Ratio อัตโนมัติ" | AI เขียน `lab4-capture.spec.ts` ดำเนินการแคปเจอร์ภาพหน้าจอ 3 ขนาด (Desktop, Tablet, Mobile) ครบ 15 ภาพ พร้อมสร้างตาราง Checklist วัดผลจริงออกมาเป็น Markdown |

---

## 3. My Reflection

จากการทำงานร่วมกับ AI ในรูปแบบ **Multi-Agent Collaboration** (ใช้ **Claude** เป็นผู้ตรวจทานและผู้วางแผนสเปค ควบคู่กับ **Antigravity / Gemini** เป็นผู้เขียนโค้ดและรันชุดทดสอบ) ตลอด Sprint 4 ได้ค้นพบบทเรียนเชิงลึกดังนี้:

### 1. จุดแข็งและประโยชน์ที่ได้รับ (Strengths & Productivity Gains)
* **Layered Verification (การตรวจสองชั้น):** การใช้ Claude ตรวจโค้ดที่ Antigravity เขียน ช่วยอุดช่องโหว่ประเภท "เทสต์ผ่านแต่โค้ดไม่สมบูรณ์" ได้อย่างมีประสิทธิภาพ เช่น กรณีที่ Antigravity เขียน Unit Test ผ่าน แต่ Claude ตรวจพบว่าตัวแปร `isSubmittingRef` ถูกประกาศทิ้งไว้โดยไม่ได้นำไปใช้ใน Event Handler จริง
* **Speed & Coverage:** การสร้างชุดทดสอบ Automated E2E ด้วย Playwright ครอบคลุม 12 Scenarios และการแคปเจอร์ภาพ Responsive 3 ขนาด (15 ภาพ) สามารถทำได้อย่างรวดเร็ว แม่นยำ และมีระบบระเบียบมากกว่าการแคปด้วยมือ

### 2. ข้อจำกัดและเหตุการณ์จริงที่ต้องระวัง (Limitations & Real-world Lessons)
* **AI Tunnel Vision & Silent Failures:** AI มักจะโฟกัสเฉพาะจุดที่คำสั่งระบุ ทำให้เกิดผลกระทบข้างเคียง (Side-effects) เช่น เมื่อสั่งแก้ Query หลังบ้านให้รองรับ Urgent Card ตัว AI ได้แก้ไข Query Builder แต่ลืมไปอัปเดต Component หน้าบ้าน `StaffTicketQueue.tsx` ส่งผลให้หน้าคิวยังคงแสดงผลตั๋ว 10 ใบไม่ตรงกับการ์ด (จนมนุษย์ต้องตรวจพบและสั่งแก้ไข)
* **Timezone Offset Pitfalls:** การจัดการเวลาใน JavaScript Date Object เป็นจุดที่ AI มักเขียนโค้ดซับซ้อนเกินไปจนเกิด Timezone Shift (เช่น ฟอร์มบันทึกเวลาบ่าย แต่ระบบส่งค่า UTC ที่ทำให้หน้าจอแสดงเวลาเช้า) บทเรียนคือต้องกำหนดมาตรฐาน Format ตั้งแต่ Specification และใช้ฟังก์ชันแปลงเวลาที่อิง Local Clock โดยตรง
* **ความสำคัญของ Human-in-the-Loop & Strict Boundaries:** การมอบหมายให้ AI รันคำสั่ง Git ต้องกำหนดขอบเขตที่เข้มงวดเสมอ ห้ามอนุญาตให้ AI รันคำสั่งทำลายล้าง เช่น `git clean -fd`, `prisma migrate reset` หรือ `git push --force` โดยปราศจากการอนุมัติจากผู้พัฒนา มนุษย์ต้องเป็นผู้ควบคุม Branching Strategy และตรวจทาน PR ทุกใบก่อน Merge เสมอ

### 3. บทสรุป (Conclusion)
AI ไม่สามารถแทนที่ Software Engineer ได้ แต่ AI ทำหน้าที่เสมือน **Junior Developer ที่มีความเร็วสูง** ควบคู่กับ **Senior Reviewer ที่ช่วยหาจุดบกพร่อง** โดยความสำเร็จของซอฟต์แวร์ยังคงขึ้นอยู่กับความสามารถของมนุษย์ในการกำหนด Architecture, การตั้ง Acceptance Criteria ที่รัดกุม, และการตรวจสอบความถูกต้องบนระบบจริงในขั้นสุดท้าย
