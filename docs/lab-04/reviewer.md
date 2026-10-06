# Lab 4 Peer Review Log

เอกสารนี้รวบรวมประวัติการทำ Cross-project Peer Review และข้อเสนอแนะที่ได้รับจากผู้ตรวจประเมินในระหว่างการทำงาน Lab 4 (TokTickIT - Sprint 2)

## ข้อมูลผู้รีวิว (Reviewers)
- **Peer Reviewer / QA** (เพื่อนร่วมงาน / ผู้ทดสอบระบบ)

## สรุปการรีวิวที่สำคัญใน Lab 4

### 1. PR: Issue 7a - Checkpoint 2 Fixes (Staff Dashboard Bug)
- **Branch:** `feat/lab4-07a-cp2-fixes`
- **Feedback จากผู้รีวิว:**
  - พบปัญหา **Incomplete Vertical Slice**: Backend แก้นับรวมสถานะ `REOPENED` ให้แล้ว แต่ Frontend ฝั่ง Staff หน้าจอลืมอัปเดต Filter ทำให้หน้า StaffTicketQueue แสดงข้อมูลผิดพลาด (กด Drill-down แล้วไม่เจอ REOPENED)
- **การแก้ไข:** 
  - แก้ไข `StaffDashboard.tsx` โดยใช้ค่าคงที่ `STAFF_OPEN_STATUSES` (`OPEN,REOPENED`) ส่งไปใน URL query parameter แทนค่า hardcoded เก่า
  - อัปเดต `StaffDashboard.test.tsx` ให้ครอบคลุม Filter ตัวใหม่

### 2. PR: Issue 7b - Regression & Visual Hardening
- **Branch:** `feat/lab4-07b-hardening`
- **Feedback จากผู้รีวิว:**
  1. **Drill-down UI Bug:** ดรอปดาวน์ Filter พังเมื่อกดมาจาก Dashboard เนื่องจากค่า `<option>` ไม่ตรงกับ Filter ใหม่ที่เพิ่งแก้ไป (เช่น ส่งค่า `NEW,OPEN,REOPENED` มา แต่ใน `<select>` ไม่มีตัวเลือกนี้) ทำให้หน้าจอแสดงค่าว่าง
  2. **UX Consistency (Raw Enum):** บั๊กข้อความสถานะดิบโผล่บนหน้าจอ (เช่น `IN_PROGRESS`) เพราะตอนแยกคอมโพเนนต์ `StatusBadge` ลืมทำ text formatting
  3. **Priority Casing:** ตัวพิมพ์เล็ก-ใหญ่ใน Priority Badge ไม่สม่ำเสมอ (เช่น Req ส่งมา `High` แต่ IT ส่งมา `HIGH`)
- **การแก้ไข:**
  - เพิ่ม `<option>` value แบบ composite ลงใน `MyTickets.tsx` และ `StaffTicketQueue.tsx` ให้ตรงกับ Dashboard
  - สร้าง Helper function `formatText` ใน `Badges.tsx` เพื่อแปลงเครื่องหมาย Underscore เป็นช่องว่าง และจัดรูปแบบตัวอักษรให้เป็น Title Case ทั้งหมด

---
**บทสรุป:** การทำ Peer Review ช่วยให้เห็นจุดอ่อนของการ Refactor โค้ดที่นักพัฒนา (และ AI) มักตกหล่น หรือสิ่งที่เรียกว่า "Silent Failures" เช่น บั๊กของการแสดงผล UI และ Dropdown ค่าว่างที่ Automated Tests (Vitest) ไม่สามารถตรวจจับได้ 