# เช็คลิสต์เริ่มงาน Issue — ใช้ทุกครั้งก่อนเริ่มโค้ด

ใช้ 8 ขั้นตอนนี้ทุกครั้งที่จะเริ่มทำ Issue ใหม่ (Issue #2-10) ไม่ว่า Phase ไหนก็ตาม

---

## ขั้นตอนที่ 1 — อ่าน Scope ก่อนแตะโค้ด

1. เปิด Issue บน GitHub อ่าน Scope + Checklist ที่เขียนไว้
2. เปิด `docs/lab-03/specification.md` หา section ที่เกี่ยวกับ Issue นี้:
   - FR ไหนที่ Issue นี้ implement
   - BR ไหนที่ต้อง enforce
   - AC ไหนที่ต้องทำให้ผ่าน (เอาไปเทียบกับ `tests.md` ว่ามี test รออยู่แล้วหรือยัง)
3. ถ้ามีข้อไหนไม่ชัด **อย่าหยุดรอ** ให้จดสมมติฐานของตัวเองไว้ในคอมเมนต์ Issue แล้วทำต่อ (เผื่อเพื่อน/ตัวเองย้อนมาดูทีหลัง)

---

## ขั้นตอนที่ 2 — Sync branch ให้สะอาดก่อนเริ่ม

```bash
git checkout lab3-staging
git pull origin lab3-staging
git checkout -b feat/lab3-XX-<ชื่อสั้นๆ>
```

**เช็คก่อนเสมอ:** Issue นี้ต้องรอ Issue ไหนก่อนไหม (ดูตาราง "ขึ้นกับ Issue ไหนก่อน" ในแผนหลัก) — ถ้า Issue ที่ต้องพึ่งพายังไม่ merge เข้า `lab3-staging` **ห้ามเริ่ม** ให้ไปเช็ค/เร่งอันนั้นก่อน

---

## ขั้นตอนที่ 3 — เลือก AI + เขียน prompt ให้ scope ชัด

**เลือกตามตารางนี้ (ทบทวนจากที่วางไว้):**
| งาน | AI |
|---|---|
| แก้/เขียน doc | Claude / Antigravity chat |
| Feature ใหญ่ แตะหลายไฟล์ (backend+frontend+test) | Antigravity agentic |
| แก้จุดเล็ก scope แคบ | Codex |

**Template prompt ที่ใช้ได้ทุก Issue:**
```
ทำงานใน repo TokTickIT (CPE334 Lab3) — [ชื่อ Issue]

Context:
- อ้างอิง FR-xx, BR-xx, AC-xx จาก docs/lab-03/specification.md
- ต้องผ่าน test ตามที่ระบุใน docs/lab-03/tests.md (Test ID: ...)
- Reuse pattern จาก Lab2 ที่มีอยู่แล้วในไฟล์: [ระบุไฟล์ที่คล้ายกันจาก Lab2]
- ห้ามแก้ไฟล์นอกเหนือจาก: [ระบุขอบเขตไฟล์ที่แตะได้]

งานที่ต้องทำ:
1. ...
2. ...

Business rules ที่ต้อง enforce ที่ backend จริง (ไม่ใช่แค่ UI):
- BR-xx: ...
```

**สำคัญ:** ระบุ "ห้ามแก้ไฟล์นอกเหนือจาก..." ทุกครั้ง กัน AI ไปแตะไฟล์ที่ไม่เกี่ยวจนเกิด merge conflict กับตัวเองหรือเพื่อน

---

## ขั้นตอนที่ 4 — เช็ค dependency ก่อนรันจริง

ก่อนให้ AI เริ่ม generate โค้ดจริงจัง เช็คไว:
- ถ้า Issue นี้ต้องใช้ schema จาก Migration (#3) → รัน `npx prisma generate` เช็คว่า schema ล่าสุดอยู่ใน branch ที่ checkout ออกมาจริง
- ถ้า Issue นี้ต้องใช้ auth middleware (#4) → เช็คว่า middleware merge เข้า `lab3-staging` แล้ว ไม่ใช่ยังค้างใน branch อื่น

---

## ขั้นตอนที่ 5 — ตรวจโค้ดที่ AI generate มา ก่อนรัน test

1. ไล่ diff คร่าวๆ ด้วยตาก่อน (ไม่ต้องละเอียดมาก) — เช็คว่า AI แตะเฉพาะไฟล์ที่บอกไว้จริงไหม
2. รัน regression เดิมก่อน (Lab2 + Phase ก่อนหน้าที่ merge แล้ว) ว่ายังผ่านอยู่
3. รัน test ที่ระบุใน `tests.md` สำหรับ AC ของ Issue นี้โดยเฉพาะ

```bash
cd server && npx vitest run
cd .. && npx playwright test
```

---

## ขั้นตอนที่ 6 — เก็บ Screenshot ตามจุดที่กำหนด (ถ้า Issue นี้มี UI)

เปิดไฟล์ `lab3-project-plan.md` ส่วน "จุดแคปรูป" ของ Phase นี้ ถ่ายทันทีตอนฟีเจอร์ทำงานถูกต้อง อย่ารอไปแคปทีหลังตอนข้อมูล seed เปลี่ยนไปแล้ว

---

## ขั้นตอนที่ 7 — เปิด PR ด้วย Template

ใช้ PR template ที่วางไว้ (scope, requirement checklist, test evidence, screenshot) แล้ว:
```bash
git add .
git commit -m "feat(lab3-XX): <คำอธิบายสั้น>"
git push -u origin feat/lab3-XX-<ชื่อ>
gh pr create --base lab3-staging --title "..." --body-file pr-template.md
```
ย้าย Issue ไป column "In Review" บน Kanban

---

## ขั้นตอนที่ 8 — หลัง Merge

1. merge PR เข้า `lab3-staging`
2. ย้าย Issue ไป "Done"
3. ลบ local branch ที่ใช้แล้ว: `git branch -d feat/lab3-XX-<ชื่อ>`
4. เช็คว่า Issue ถัดไปที่ "รอ" Issue นี้ (dependency) ตอนนี้เริ่มได้แล้ว → กลับไปขั้นตอนที่ 1 กับ Issue ถัดไป

---

## Quick Reference: จุดที่ต้องเช็คเป็นพิเศษต่อ Issue

| Issue | ก่อนเริ่มต้องมีอะไร merge แล้วบ้าง | ระวังอะไรเป็นพิเศษ |
|---|---|---|
| #2 Test DD | Spec DD (#1) | ต้อง map ครบทั้ง AC และ BR ไม่ใช่แค่ AC |
| #3 Migration | Spec DD, Test DD | idempotent seed, ห้าม plaintext password |
| #4 Auth | Migration | error message ต้อง generic กัน enumeration |
| #5 Requester regression | Auth | requesterId มาจาก session เท่านั้น |
| #6 Staff Queue | Migration | default sort/pagination ต้องตรง api-spec.md |
| #7 Staff Detail | Staff Queue | internal note บล็อก Requester ที่ backend จริง |
| #8 Admin Users | Migration | self-deactivate, last-admin guard |
| #9 E2E/Visual | ทุก feature issue เสร็จ | screenshot ครบ 3 breakpoint ทุกหน้า |
| #10 Release | ทุกอย่างข้างบน | reviewer.md ต้องมี evidence จริงจาก PR ทั้งหมด |
