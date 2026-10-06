# AI Assistance Log & Reflection (Lab 4)

## LLM Tools Used
- Antigravity IDE (Gemini / Code Agent)

## Key Prompts Table

| No. | Purpose | Prompt Summary | Output Quality / Action Taken |
|---|---|---|---|
| 1 | Full-Stack Feature Execution | "เริ่มทำ Issue 5 (Requester Dashboard) โดยยึดตาม LAB4_sheet.md ขอแบบ Full-stack ตั้งแต่ API จนถึง UI และรันเทสต์ด้วย" | AI successfully generated the backend API `/api/dashboard/requester`, the UI component, and connected metrics seamlessly with robust Vitest tests. |
| 2 | Bug Catching (AI Tunnel Vision) | "ลืมแก้ Frontend ฝั่ง Staff! ตอนนี้แก้ Backend ให้นับรวม REOPENED ไปแล้ว แต่ในหน้าจอ UI นายลืมอัปเดต Filter" | AI acknowledged the "Tunnel Vision" where it focused only on the backend tests. It then immediately updated `StaffDashboard.tsx` to match the new filter constant. |
| 3 | Visual UX Fixing | "เพื่อนรีเควส PR มา... ดรอปดาวน์ Filter พังเมื่อกดมาจาก Dashboard... บั๊กข้อความสถานะดิบโผล่บนหน้าจอ... ตัวพิมพ์เล็ก-ใหญ่ไม่สม่ำเสมอ" | AI quickly identified that passing tests don't guarantee good UI. It added a `formatText` helper to format enum strings and synced the `<select>` HTML options globally. |
| 4 | Git Command Safety | "คุณ push ให้ผมเองหลอ" | AI admitted it broke the rule of auto-pushing without permission, reverted to proposing commands for manual execution, ensuring strict human-in-the-loop control. |
| 5 | Database Seeding | "ขออีเมล... ไม่ถูก... admin@toktickit.com รหัสด้วย" | AI investigated the login failure, autonomously ran `npx prisma db seed` to reset the database state, and successfully provided the correct credentials for UI testing. |

---

## My Reflection

จากการใช้งาน AI ในฐานะ Pair-programming Assistant ตลอด Lab 4 พบประเด็นที่น่าสนใจและข้อควรระวังดังนี้:

### จุดแข็ง (Strengths)
1. **Speed in Boilerplate & Testing:** AI สามารถเขียน Unit Tests (Vitest) และสร้าง API Routes ใหม่ๆ เช่น หน้า Dashboard ได้อย่างรวดเร็วมาก ช่วยประหยัดเวลาในการวางโครงสร้างและเขียนเคสซ้ำๆ
2. **Global Refactoring:** เมื่อได้รับคำสั่งที่ชัดเจน เช่น "แยก Badges ออกมาเป็น Common Component และเพิ่ม Accessibility" AI สามารถแยกไฟล์และตามไปแก้ import ในหน้า Dashboard ทั้งหมด 5 ไฟล์รวดได้ทันที

### ข้อจำกัดและบทเรียน (Limitations & Lessons Learned)
1. **AI Tunnel Vision (การมองไม่เห็นภาพรวม):** AI มักจดจ่ออยู่กับการทำเทสต์ให้ผ่าน (Green Tests) จนลืมแก้ไขผลกระทบต่อเนื่อง เช่น แก้ API ให้นับ `REOPENED` แล้ว แต่ลืมแก้ UI ให้ส่งพารามิเตอร์ `REOPENED` ไปด้วย บทเรียนคือต้องสั่งให้ AI ทำ `grep_search` ค้นหาผลกระทบทั่วทั้งโปรเจกต์ก่อนแก้ไขเสมอ
2. **Silent Failures ทางหน้าจอ (UX/UI):** AI ไม่สามารถ "ใช้ตามอง" หน้าเว็บได้เหมือนมนุษย์ แม้โค้ดจะเทสต์ผ่าน 100% แต่บนหน้าจออาจจะแสดงคำว่า `IN_PROGRESS` แบบดิบๆ หรือมีค่า Dropdown หายไป ดังนั้นมนุษย์จึงต้องเป็นคนสั่งรัน `npm run dev` และตรวจเช็คด้วยตาทุกครั้งที่มีการแก้ UI (Visual Inspection)
3. **ความปลอดภัยในการทำงานกับ Git:** การปล่อยให้ AI รันคำสั่ง Git เองทั้งหมดอาจเกิดเหตุการณ์ "หวังดี" Push โค้ดขึ้นไปโดยไม่บอกกล่าว การตกลงกฎให้ชัดเจนว่า "ห้ามรัน git commit/push เอง ให้พิมพ์บอกเท่านั้น" เป็นสิ่งที่จำเป็นมากในการทำ Collaboration กับเพื่อนร่วมทีม

**สรุป:** AI เป็นเครื่องมือช่วยเขียนโค้ดที่ทรงพลังมาก แต่ยังคงต้องการ "มนุษย์" ในการทำหน้าที่เป็น Director (ควบคุมทิศทาง), QA (ตรวจหน้าจอจริง), และ Reviewer (ตรวจสอบความปลอดภัยก่อนส่งโค้ด) เสมอครับ