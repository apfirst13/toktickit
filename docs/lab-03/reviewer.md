# Lab 3 Peer Review Log

เอกสารนี้รวบรวมประวัติการทำ Cross-project Peer Review และข้อเสนอแนะที่ได้รับจากผู้ตรวจประเมินในระหว่างการทำงาน Lab 3 (TokTickIT)

## ข้อมูลผู้รีวิว (Reviewers)
- **Theerawat82** (Theerawat)
- **sawaddeekubkuy-creator**

## สรุปการรีวิวที่สำคัญใน Lab 3

### 1. PR #59: Issue 8 - Administrator User Management
- **Link:** [https://github.com/apfirst13/toktickit/pull/59](https://github.com/apfirst13/toktickit/pull/59)
- **Feedback จากผู้รีวิว (`sawaddeekubkuy-creator`):**
  1. **Backend:** ขอให้สลับลำดับ Safety Guard ในระบบจัดการผู้ใช้ โดยให้เช็คเรื่อง "ห้าม Admin Deactivate ตัวเอง" (`isDeactivating`) ขึ้นมาก่อนที่จะไป Query ตรวจสอบ `activeAdminsCount` ในฐานข้อมูล เพื่อลดภาระการทำงานของ Database
  2. **Frontend:** ตรวจพบว่าช่องค้นหา (Search) มีการยิง API ทันทีทุกครั้งที่พิมพ์ ทำให้มีการ Re-render หนัก ขอให้เพิ่ม `useDebounce` เพื่อหน่วงเวลาสัก 300ms
  3. **Security:** ขอให้ดักจับ Route สำหรับผู้ใช้ที่โดนบังคับเปลี่ยนรหัสผ่าน (`mustChangePassword = true`) เพื่อไม่ให้เข้าถึงหน้าอื่นๆ ได้
- **การแก้ไข:** 
  - สลับลำดับ Logic ใน `updateUser` ของ `users.controller.ts` เรียบร้อย
  - สร้าง Custom Hook `useDebounce` และนำไปครอบตัวแปร `search` ในหน้า `UserManagement.tsx`
  - เพิ่ม Route Guard ใน `App.tsx` เพื่อดักจับและ Redirect ไปที่หน้า Change Password

### 2. PR #60: Issue 9 - E2E Testing Full Flow
- **Link:** [https://github.com/apfirst13/toktickit/pull/60](https://github.com/apfirst13/toktickit/pull/60)
- **Feedback จากผู้รีวิว:**
  - ตรวจพบว่ามีไฟล์ Scratch (สคริปต์สำหรับการแก้ไขชั่วคราว) หลุดติดเข้ามาใน Commit
  - เข้าใจผิดว่าไฟล์ Frontend หายไปจาก Commit
- **การแก้ไข:**
  - สั่งลบไฟล์ `scratch_replace*.js` ออกจาก Repository ทั้งหมด
  - อธิบายชี้แจงกับผู้รีวิวว่าไฟล์ Frontend (`App.tsx` และ `UserManagement.tsx`) ได้ถูก Merge ไปเรียบร้อยแล้วใน PR #59 ทำให้ไม่แสดงขึ้นมาใน Diff ของ PR #60

### 3. PR #56, #57: Issue 6 & 7 - IT Staff Features
- **Link:** 
  - [PR #56](https://github.com/apfirst13/toktickit/pull/56)
  - [PR #57](https://github.com/apfirst13/toktickit/pull/57)
- **สถานะ:** 
  - ผู้รีวิว `Theerawat82` ได้ทำการตรวจสอบความถูกต้องและ Approve เรียบร้อย

---
**บทสรุป:** การทำ Peer Review ช่วยให้ค้นพบช่องโหว่ทางด้าน Performance (เช่น การขาด Debounce) และช่วยจัดระเบียบ Logic ฝั่ง Backend ให้มีประสิทธิภาพมากขึ้นก่อนที่จะเทิร์นของขึ้นสู่ Production
