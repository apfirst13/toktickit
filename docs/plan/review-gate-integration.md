# Review Gate Integration — เชื่อม Protocol กับ Checklist เข้าด้วยกัน

ไฟล์นี้เป็นตัวเชื่อม `antigravity-working-protocol.md` (Phase A-E) กับ `pr-review-checklist.md` (เกณฑ์อนุมัติ) ให้ทำงานอัตโนมัติ ไม่ต้องแปะ checklist เองทุกรอบ

---

## วิธีใช้ — เพิ่ม 1 ย่อหน้านี้ต่อท้ายทุก prompt ที่สั่งให้ Antigravity เริ่มเขียนโค้ด (Phase C ของ Protocol)

```
ก่อนรายงานว่างานเสร็จ ให้คุณรัน Self-Check ตาม pr-review-checklist.md เอง 
ทุกข้อใน Section A (Universal Gates) และ Section B ที่เกี่ยวข้องกับงานนี้ 
(ดูจากหมวดที่ตรงกับประเภทงาน เช่น Queue/List API ใช้ B ส่วน Queue)

ตอบเป็นตารางตรงตาม format ในไฟล์เป๊ะ (checkbox แต่ละข้อ + หมายเหตุ) 
ห้ามข้ามข้อไหน ถ้าข้อไหนไม่แน่ใจหรือยังไม่ได้ทำ ให้ตอบว่า "ยังไม่ผ่าน" 
พร้อมเหตุผล ห้ามเดาว่าผ่านแล้ว

จบด้วย Section C: Decision — ประเมินตัวเองว่า Approved / Approved with 
conditions / Rejected พร้อมเหตุผล

สำหรับข้อที่เกี่ยวกับตัวเลข (test count, todo count, diff scope) ต้องแสดง 
หลักฐานจริงประกอบ (เช่น git diff --stat, รายชื่อ test ที่เพิ่ม) ไม่ใช่แค่ 
สรุปตัวเลขลอยๆ
```

การทำแบบนี้ทำให้ Antigravity ส่งรายงานที่มีโครงเดียวกับที่ James ทำ "Applied Review" ของ Issue 6 มาให้เองอัตโนมัติทุก Issue — ลดงาน manual ลงเยอะ

---

## แต่ห้ามเชื่อ Self-Check 100% — Spot-Check เองเฉพาะจุดเสี่ยงสูง

จาก pattern ที่เจอมา (Issue 2, 4, 5) AI มักโกหกเรื่อง **ไฟล์ที่อ้างว่าสร้าง/ลบ**, **test ที่อ้างว่าผ่าน**, และ **status code ที่อ้างว่าถูกต้อง** — 3 หมวดนี้ต้องยืนยันด้วยคำสั่งจริงเสมอ ไม่ว่า self-check จะตอบว่าอย่างไร

```powershell
# 1. ยืนยัน A1/A2 (authorization + status code) — ยิง API ตรงจริง ไม่เชื่อคำตอบ agent
# ตัวอย่าง: role ไม่ตรงต้องได้ 403 จริง ไม่ใช่แค่ agent บอกว่า "มี" 403
# (ปรับ endpoint/token ตามงานจริงของแต่ละ Issue)
curl -i -H "Authorization: Bearer <token ของ role ที่ไม่ควรเข้าได้>" http://localhost:<port>/api/<endpoint>

# 2. ยืนยัน A4 (test count จริง ไม่ใช่ยอดที่ agent สรุป)
cd server; npx vitest run 2>&1 | Select-String "Test Files|Tests "; cd ..
git diff --stat HEAD~1 -- server/tests client/src/tests

# 3. ยืนยัน A5 (scope control — ไฟล์ที่แก้ตรงกับที่อนุญาตจริง)
git status
git diff --stat HEAD

# 4. ยืนยัน A6 (doc traceability — api-spec.md อัปเดตจริงตรงกับ endpoint)
Select-String -Path docs\lab-03\api-spec.md -Pattern "<endpoint ที่เพิ่งทำ>"

# 5. เช็ค anti-pattern เดิมไม่กลับมา (mock auth, testPath branching, status hack)
Select-String -Path server\**\*.ts -Pattern "vi\.mock.*auth|testPath|statusCode ="
```

**กฎ:** ข้อไหนใน self-check ตอบว่า "ผ่าน" แต่ spot-check ข้างบนไม่ยืนยัน → ถือว่า **ไม่ผ่าน** เปลี่ยน decision เป็น "Rejected / Needs rework" ทันที ไม่ว่า agent จะยืนยันแค่ไหนก็ตาม

---

## Flow เต็มต่อ 1 Issue (สรุปรวม 3 ไฟล์เข้าด้วยกัน)

1. **Phase A-B** (`antigravity-working-protocol.md`): Spec Gate → กฎเหล็ก → เริ่มเขียนโค้ด
2. **Phase C** (`antigravity-working-protocol.md` + ย่อหน้าบนของไฟล์นี้): implement ทีละส่วน + self-check checklist อัตโนมัติท้ายงาน
3. **Spot-check** (ไฟล์นี้): James รันคำสั่งจริงยืนยันเฉพาะจุดเสี่ยงสูง 5 ข้อ
4. **Section C Decision**: ถ้า Approved with conditions → ส่งเงื่อนไขกลับให้ Antigravity แก้ แล้ววนกลับไป Phase C ใหม่จนกว่าจะ Approved จริง
5. **Phase E** (`antigravity-working-protocol.md`): เปิด PR

---

## อัปเดต pr-review-checklist.md เพิ่มเติม (ข้อเสนอ ไม่บังคับ)

พิจารณาเพิ่ม Section B ใหม่สำหรับ feature type อื่นที่กำลังจะเจอใน Issue 7-8:
- **Section B2: Detail/Update API** (Issue 7 Staff Detail) — เช็ค status transition matrix ถูก enforce จริง, ownership assignment validate role/active ก่อน assign
- **Section B3: Admin CRUD** (Issue 8) — เช็ค duplicate email 409, self-deactivate guard, last-admin guard ทั้งหมด enforce ที่ backend ไม่ใช่ UI

เพิ่มตอนถึง Issue 7 ก็ได้ ไม่ต้องทำตอนนี้
