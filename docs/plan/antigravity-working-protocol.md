# Antigravity Working Protocol — TokTickIT Lab 3

ใช้ไฟล์นี้เป็น "สคริปต์" คุยกับ Antigravity ทุก Issue ที่เหลือ (7 ถึง 11) เรียงตาม Phase A → E ทุกครั้ง ไม่ต้องถามซ้ำ

อ้างอิงไฟล์อื่นประกอบ: `lab3-ai-verification-checklist.md` (ไฟล์ที่ต้องมีต่อ Issue), `lab3-issue-kickoff-checklist.md` (ขั้นตอนกว้างๆ), `pr-review-system.md` (ตอนรีวิวเพื่อน)

---

## Phase A — Spec Gate (ห้ามเขียนโค้ดจนกว่า spec จะนิ่ง)

**Prompt เปิดงานทุก Issue:**
```
บริบท: Lab 3 CPE 334 (TokTickIT), กำลังทำ Issue #[เลข]: [ชื่อ Issue]
Branch: feat/lab3-[ชื่อ] (แตกจาก lab3-staging ที่สะอาดแล้ว)
Acceptance Criteria: [AC-xx ที่เกี่ยวข้อง — ดึงจาก lab3-ai-verification-checklist.md 
หรือ specification.md จริง ห้ามตั้งเลขเอง]

อ่าน docs/lab-03/specification.md, api-spec.md, ui-spec.md ที่มีอยู่แล้วก่อน 
เพื่อเช็คว่า field/endpoint/UI ของงานนี้ถูกกำหนดไว้ครบหรือยัง ถ้ายังไม่ครบ 
ให้เสนอเพิ่มก่อนเขียนโค้ด ไม่ใช่เขียนโค้ดแล้วค่อยย้อนกลับมาทำ spec

[แปะ checklist งานที่ต้องทำของ Issue นี้]

ทำตามลำดับนี้: อ่าน spec ก่อน → เสนอ spec เพิ่มเติมถ้าจำเป็น (รอ approve) 
→ implement backend + test → implement frontend + test → รัน full test 
suite ทั้งสองฝั่ง → แสดง diff รอ approve → commit ตามที่อนุมัติ
```

**Checklist เช็คก่อนจะ approve spec ที่เสนอมา (ต้องมีครบ ไม่งั้นส่งกลับไปแก้):**
- Response shape เต็ม (รวม pagination metadata ถ้าเกี่ยวข้อง)
- Whitelist ของ field ที่ sort/filter ได้ (กัน injection)
- พฤติกรรมเมื่อ query param ผิด format (fallback default หรือ 400 — ต้องเลือกชัด)
- HTTP status code ของทุกเคส authorization พร้อม**เหตุผล**ว่าทำไมเป็น 403 ไม่ใช่ 404 (หรือกลับกัน) — อิง BR ที่เกี่ยวข้อง
- Role ที่อนุญาตระบุชัดเจน
- ถ้ามี pagination: default/max page size ระบุชัด
- ถ้ามี UI ใหม่: แยก empty state vs no-results state ชัดเจน, ระบุ field หลักที่โชว์บน mobile card

---

## Phase B — กฎเหล็ก (แปะต่อท้ายทุก prompt ที่สั่งให้เริ่มเขียนโค้ด)

```
กฎเหล็กที่ต้องปฏิบัติตามตลอดงานนี้:
1. ห้ามสร้างไฟล์ scratch/debug script (fix*.js, do_*.js, *.py ชั่วคราว) 
   ที่ root หรือที่ใดในโปรเจกต์เพื่อช่วยแก้ไฟล์อื่น แก้ไฟล์ตรงๆ ด้วย edit 
   tool เท่านั้น
2. ถ้าจำเป็นต้องใช้สคริปต์ชั่วคราวจริงๆ ต้องลบทิ้งทันทีในขั้นตอนเดียวกัน 
   และรายงานว่าสร้าง-ลบอะไรไปในสรุปงานเสมอ
3. ห้ามใช้ git add . หรือ git add -A เด็ดขาด ใช้ git add <specific-file> เท่านั้น
4. ก่อน commit ทุกครั้ง รัน git status แสดงให้ดูก่อนว่ามีไฟล์ untracked ติดมาบ้าง
5. ห้าม vi.mock()/jest.mock() ครอบ auth middleware, Prisma Client, หรือ 
   controller ใดๆ ทุก test ต้องยิง request จริงผ่าน supertest พร้อม JWT 
   token จริง (ใช้ jwt.sign() สร้าง token จริงถ้าต้องการ authenticated request)
6. ห้ามเช็ค testPath หรือชื่อไฟล์ test เพื่อสร้างพฤติกรรมพิเศษเฉพาะไฟล์
7. ห้าม monkey-patch หรือ override method ของ Express response object 
   หรือ override status code ด้วยวิธีใดๆ เพื่อให้ test ผ่าน
8. แสดง diff เต็มของทุกไฟล์ที่แก้/สร้างใหม่ก่อน commit เสมอ ห้าม commit 
   หรือ push เอง รอการอนุมัติก่อนทุกครั้ง
9. รัน "cd server && npx vitest run" และ "cd client && npx vitest run" 
   แยกกัน (ไม่รันจาก root) รายงานผลจริงแบบเต็ม ไม่ใช่แค่สรุป
10. ถ้าจำเป็นต้องแก้ไฟล์นอกเหนือขอบเขตที่ระบุไว้ (เช่นต้องแก้ app.ts เพื่อ 
    mount router ใหม่) ให้หยุดและขออนุมัติก่อน อธิบายเหตุผลว่าทำไมจำเป็น
```

---

## Phase C — ลำดับ Implementation + จังหวะขอ diff

สั่งเสมอว่า **"ทำทีละส่วน แสดง diff เป็นช่วงๆ ไม่ต้องรอทำเสร็จทั้งหมดแล้วโยน diff มาทีเดียว"**:

1. Backend + backend test → แสดง diff → รอ approve
2. Frontend + frontend test → แสดง diff → รอ approve
3. รัน full test suite ทั้งสองฝั่งแยกกัน → รายงานผลเต็ม

เหตุผล: แก้ทีละก้อนเล็กจับปัญหาได้เร็วกว่า ไม่เสี่ยงเจอปัญหาสะสมแบบ Issue 5 ที่ต้องย้อนแก้หลายรอบ

---

## Phase D — Verification หลังบอกว่า "เสร็จแล้ว" (ก่อนเชื่อ 100%)

ใช้คู่กับ `lab3-ai-verification-checklist.md` (มีตารางเฉพาะ Issue) บวกชุดคำสั่งทั่วไปนี้ทุกครั้ง:

```powershell
# 1. ไฟล์ scratch หลุดมาไหม
git status

# 2. เช็คว่าไม่มี anti-pattern ที่เคยเจอกลับมา
Select-String -Path server\tests\**\*.ts,server\vitest.setup.ts -Pattern "vi\.mock|testPath|statusCode ="

# 3. เช็คว่าไฟล์ที่ diff แก้ ตรงกับขอบเขตที่อนุญาตจริง (ไม่มีไฟล์แปลกโผล่)
git diff --stat HEAD

# 4. รัน regression เต็มทั้งสองฝั่งอีกรอบด้วยตัวเอง (ไม่เชื่อผลที่ AI รายงานมา)
cd server; npx vitest run; cd ..
cd client; npx vitest run; cd ..

# 5. เช็คไฟล์ที่ Issue นี้ต้องมีจริง (ดูตารางใน lab3-ai-verification-checklist.md)
# ใช้ Test-Path ไล่ทีละไฟล์ตามที่ Issue นั้นระบุ
```

**กฎการอ่านผล:** ทุกข้อที่ AI สรุปว่า "ทำแล้ว/ผ่านแล้ว/ครบแล้ว" ต้องมีหลักฐานจริงจากคำสั่งข้างบนรองรับ ถ้าไม่มีหลักฐาน = ยังไม่เชื่อ

---

## Phase E — เปิด PR

ใช้ PR template จาก `lab3-project-plan.md` — scope, requirement checklist, test evidence, screenshot ถ้ามี UI

---

## บทเรียนสำคัญที่ทำให้ต้องมี Protocol นี้ (สรุปจาก Issue 4-6)

| เหตุการณ์ | สิ่งที่เรียนรู้ |
|---|---|
| `auth.api.test.ts` หายทั้งที่ AI บอกว่าสร้างแล้ว (Issue 2) | ต้อง `Test-Path` ยืนยันไฟล์เสมอ ไม่เชื่อ summary |
| BR ไม่ถูก map ใน traceability matrix (Issue 2, เจอทั้งของตัวเองและของเพื่อน) | AC/BR ต้องอ้างอิงเลขจริงจาก spec เท่านั้น ห้ามตั้งเลขแยกต่อ Issue |
| แก้ spec ไปอยู่ผิด branch (ปนกับ Issue 4) | เช็ค branch ก่อนเริ่มงานทุกครั้ง, cherry-pick ทันทีถ้าพบว่าอยู่ผิดที่ |
| Antigravity mock/bypass auth middleware + ปลอม status code เพื่อให้ test ผ่าน (Issue 5) | เพิ่มกฎเหล็กข้อ 5-7 ห้าม mock/monkey-patch เด็ดขาด — "test ที่ผ่านเพราะถูกปลอม ไม่ใช่ test" |
| สร้างไฟล์ scratch (`fix_t.js`) ทิ้งไว้ในโปรเจกต์ | เพิ่มกฎเหล็กข้อ 1-2 |
| Spec ไม่ชัดตั้งแต่แรกทำให้ agent ต้องเดาแล้วแก้ทีหลังหลายรอบ (Issue 5) | เพิ่ม Phase A (Spec Gate) — ล็อก spec ให้ชัดก่อนเขียนโค้ดเสมอ |
