# TokTickIT Lab 3 — แผนงานฉบับละเอียด

โปรเจกต์: CPE334 TokTickIT Lab 3 (Users, Roles, IT Staff Ticketing, Admin Screens)
ทำคนเดียว, เพื่อนทำแยกโปรเจกต์ของตัวเอง, ต้องรีวิว PR ข้ามกัน

---

## ส่วนที่ 1 — แผน GitHub Issues

### Labels ที่ควรตั้งไว้ก่อน
`type:spec` `type:test` `type:migration` `type:feature` `type:admin` `type:fix`
`priority:blocking` (งานที่คนอื่นต้องรอ เช่น migration)
`status:needs-review`

### Milestone
สร้าง Milestone ชื่อ `Lab 3` ผูกทุก Issue เข้าด้วยกัน จะได้เห็น % ความคืบหน้าใน GitHub

### รายการ Issue (สร้างทั้งหมดตั้งแต่ต้น ลง column "Todo")

| # | ชื่อ Issue | Label | Branch ที่จะใช้ | ขึ้นกับ Issue ไหนก่อน |
|---|---|---|---|---|
| 1 | Spec DD: specification.md, ui-spec.md, api-spec.md | type:spec, priority:blocking | feat/lab3-spec | ไม่มี |
| 2 | Test DD: tests.md ครบ 7 ประเภท | type:test, priority:blocking | feat/lab3-tests | #1 |
| 3 | DB migration: schema, migrate, seed data | type:migration, priority:blocking | feat/lab3-migration | #1, #2 |
| 4 | Auth: login/logout/me/change-password | type:feature | feat/lab3-auth | #3 |
| 5 | Requester regression: ลบ Dev selector, ผูก auth จริง, Public Comment, Resolved action | type:feature | feat/lab3-requester-regression | #4 |
| 6 | IT Staff Ticket Queue: API + UI (search/filter/sort/pagination) | type:feature | feat/lab3-staff-queue | #3 |
| 7 | IT Staff Ticket Detail: ownership, IT Priority, status, comments, notes | type:feature | feat/lab3-staff-detail | #6 |
| 8 | Admin User Management: list, create, edit, deactivate, reset password | type:admin | feat/lab3-admin-users | #3 |
| 9 | E2E testing ครบทุก flow | type:test | feat/lab3-e2e | #5, #7, #8 |
| 10 | Visual inspection: screenshot desktop/tablet/mobile ทุกหน้า | type:test | feat/lab3-visual | #9 |
| 11 | Release integration: merge lab3-staging → main, reviewer.md, ai-use.md | priority:blocking | (ทำบน lab3-staging) | ทุก Issue ก่อนหน้า |

### Template เนื้อหาที่ควรใส่ในแต่ละ Issue

```
## Scope
(สรุป 2-3 บรรทัดว่า Issue นี้ทำอะไร อ้างอิง section ไหนของ handout)

## Acceptance Criteria ที่เกี่ยวข้อง
AC-xx, AC-xx

## Checklist
- [ ] Implement
- [ ] เขียน/ผ่าน test ตาม tests.md
- [ ] Regression เดิมยังผ่าน
- [ ] เปิด PR ให้เพื่อนรีวิว
- [ ] Merge เข้า lab3-staging
```

---

## ส่วนที่ 2 — ขั้นตอนละเอียดแต่ละ Phase (พร้อมจุดแคปรูป และ AI ที่ใช้)

### หลักการเลือก AI ที่ใช้ในแต่ละงาน

| งาน | AI ที่แนะนำ | เหตุผล |
|---|---|---|
| เขียน spec/doc (FR, BR, authorization matrix, ui-spec, api-spec) | Claude (ที่นี่) หรือ Antigravity โหมด chat | งานเขียน/จัดโครงสร้างเอกสาร ต้องการความแม่นยำเชิงภาษาและตรรกะ ไม่ใช่การ generate โค้ดจำนวนมาก |
| เขียนโค้ด feature ใหญ่ (auth, migration, staff queue) | Antigravity (agentic, แก้หลายไฟล์พร้อมกัน) | งานที่ต้องแตะ backend+frontend+test พร้อมกันในหลายไฟล์ Antigravity เหมาะกับงาน agentic แบบนี้ |
| เขียนโค้ด scope แคบ/แก้บั๊กเฉพาะจุด | Codex | เร็ว ตรงจุด เหมาะกับ PR เล็กๆ ที่ scope ชัด |
| รีวิวโค้ดตัวเอง/ของเพื่อนก่อนส่ง PR จริง | Claude หรือ Codex (โหมด review) | ใช้เช็ค checklist อัตโนมัติก่อนให้คนจริงอ่าน |

---

### Phase 0 — Setup (ไม่มีจุดแคปรูป)
ตามที่วางไว้ก่อนหน้า: sync main, สร้าง `lab3-staging`, สร้าง Issues ทั้งหมด, ตั้งกติการีวิวกับเพื่อน (ภายใน 24 ชม.)

---

### Phase 1 — Spec DD (Issue #1)
**AI:** Claude / Antigravity chat mode (ไม่ใช้ agentic coding เพราะยังไม่เขียนโค้ด)

ขั้นตอน:
1. ป้อน handout + ให้สรุปเป็นภาษาตัวเอง ห้าม copy
2. ร่าง FR 4 กลุ่ม, BR ต่อจาก BR-05, authorization matrix (role × endpoint), AC ต่อจาก AC-04
3. ร่าง `ui-spec.md`, `api-spec.md`
4. commit → PR → merge เข้า `lab3-staging`

**ไม่มีการแคปรูปใน Phase นี้** — แต่ต้องมี **evidence ว่า commit ของ spec เกิดก่อน commit ของ implementation จริง** (ใช้สำหรับ Part 2 ของ PDF) ดังนั้นอย่าลืม push/merge Phase นี้ให้เสร็จสมบูรณ์ก่อนเริ่มโค้ดจริง

---

### Phase 2 — Test DD (Issue #2)
**AI:** Claude ช่วยไล่ AC → generate test case list, Antigravity ช่วย scaffold ไฟล์ test เปล่า (skeleton) ตามชื่อไฟล์ที่ handout กำหนด

ขั้นตอน: ตามที่วางไว้ก่อนหน้า (ตาราง Test ID/Type/AC/Expected/File)
**ไม่มีจุดแคปรูป** — ใช้เป็น evidence สำหรับ Part 3 (ตอนรันจริงค่อยเก็บผลลัพธ์)

---

### Phase 3 — DB Migration (Issue #3)
**AI:** Antigravity (agentic, ต้องแก้ schema+migration+seed หลายไฟล์พร้อมกัน)

ขั้นตอน: ตามที่วางไว้ก่อนหน้า (schema, migrate, seed, regression test)
**ไม่มีจุดแคปรูป** โดยตรง — แต่ผลการรัน `npx prisma migrate dev` และ seed สำเร็จ ควร log ไว้อ้างอิงใน Part 1 (evidence ของ git workflow) และ Part 3 (test evidence)

**Security baseline ที่ต้องมี (ระดับพื้นฐาน ไม่ต้องสุดขั้ว):**
- password hash ด้วย bcrypt/argon2 เท่านั้น ห้าม plaintext
- ห้าม commit `.env` หรือ secret ใดๆ ลง repo (เช็คว่ามีใน `.gitignore`)

---

### Phase 4 — Auth + Password Change (Issue #4)
**AI:** Antigravity (agentic ทั้ง backend API + frontend screens)

ขั้นตอน: ตามที่วางไว้ก่อนหน้า

**จุดแคปรูป (สำหรับ Part 5 ของ PDF):**
- หน้า Login (ว่าง + กรอกแล้ว)
- Login ผิด (error message)
- Login บัญชี inactive (safe failure message)
- หน้า Change Password (บังคับเปลี่ยน)
- หลัง login สำเร็จ → เห็นชื่อ+role บน shell
- Logout แล้วพยายามเข้าหน้าที่ต้อง auth → ถูก block/redirect

**Security baseline:**
- session/token ไม่ expose secret ฝั่ง client
- error message ตอน login ผิดต้อง "generic" (ไม่บอกว่า email ผิดหรือ password ผิด) กัน user enumeration ระดับพื้นฐาน
- rate limit ไม่บังคับ (เกิน scope Lab) แต่ควร comment ไว้ใน spec ว่า deferred

---

### Phase 5 — Requester Regression (Issue #5)
**AI:** Antigravity

**จุดแคปรูป (Part 6 บางส่วน + regression evidence Part 1):**
- หน้า My Tickets ของ Requester (ใช้ auth จริงแล้ว ไม่มี Dev selector)
- Ticket Detail มี Public Comment + ปุ่ม "Problem Appears Resolved"
- ผลรัน regression suite เดิมของ Lab2 (screenshot terminal หรือ CI log ว่า pass ครบ)

---

### Phase 6 — IT Staff Ticket Queue (Issue #6)
**AI:** Antigravity

**จุดแคปรูป (Part 6):**
- Queue หน้า desktop (มีข้อมูลจริงตาม seed ≥10 รายการ)
- ผลการ search/filter (ก่อน-หลัง)
- responsive mobile/tablet ของหน้า queue
- หน้า empty/no-results state
- หน้า forbidden (ถ้า Requester พยายามเข้า queue)

---

### Phase 7 — IT Staff Ticket Detail (Issue #7)
**AI:** Antigravity

**จุดแคปรูป (Part 7 — คะแนนเยอะสุด 10 คะแนน ต้องครบ):**
- claim/reassign ownership (ก่อน-หลัง)
- เปลี่ยน IT Priority
- status transition ที่ permit ได้ (เช่น Open → In Progress)
- พยายาม status transition ที่ไม่ permit → error/บล็อก
- Public Comment กับ Internal Note (ให้เห็นสีต่างกันชัดเจนในภาพเดียว)
- Attachment ที่ยังอยู่ต่อเนื่องจาก Lab2
- หลักฐาน API authorization ตรง (เช่น Postman/curl ยิง Internal Note ด้วย Requester token → 403)

---

### Phase 8 — Admin User Management (Issue #8)
**AI:** Antigravity

**จุดแคปรูป (Part 8):**
- User list (แสดง Name/Email/Role/Status/Edit)
- ผล search + filter role
- Create user (ฟอร์ม + หลัง save สำเร็จ)
- ทดสอบ duplicate email → validation error
- Edit user (เปลี่ยน role/active)
- Set initial password ใหม่ + login ครั้งถัดไปบังคับเปลี่ยน (ต่อจาก Phase 4 flow)
- พยายาม deactivate ตัวเอง → ถูกบล็อก
- พยายามลบ/ปิด admin คนสุดท้าย → ถูกบล็อก
- non-admin พยายามเข้าหน้านี้ → forbidden

**Security baseline:** validate role enum ฝั่ง backend ไม่เชื่อ input จาก client ตรงๆ, escape/validate email format กัน injection พื้นฐาน

---

### Phase 9 — Integration, E2E, Visual (Issue #9, #10)
**AI:** Antigravity รัน E2E, Claude ช่วยสรุปผลลง `tests.md`

**จุดแคปรูป (Part 9 — responsive/Zen Green checklist):**
- ทุกหน้าหลัก × desktop/tablet/mobile (รวมแล้วจะได้ชุดภาพใหญ่สุด)
- checklist: ไม่มี label ตัดคำ, ไม่มี overlap, validation อยู่ใต้ field, focus state เห็นชัด

---

### Phase 10 — Release (Issue #11)
1. PR สุดท้าย `lab3-staging` → `main`
2. เขียน `reviewer.md`, `ai-use.md`
3. merge
4. ประกอบ PDF

---

## ส่วนที่ 3 — Layout การส่ง PDF (หัวข้อ 14: Submit One PDF File)

ใช้หัวข้อ "Answer Part 1" ถึง "Answer Part 9" เรียงตามลำดับนี้เป๊ะๆ (ห้ามสลับ):

```
Answer Part 1: Git Use with Engineering Workflow (10 pts)
  - Commit history screenshot (feature branch → lab3-staging → main)
  - GitHub Project/Kanban เต็ม (ทุก Issue อยู่ Done)
  - reviewer.md (แนบ link หรือ embed เนื้อหา)
  - README + .gitignore evidence
  - โครงสร้างโฟลเดอร์ล่าสุด

Answer Part 2: Spec DD (5 pts)
  - Link + เนื้อหา specification.md แบบ render
  - ต้องมี FR, BR, authorization matrix, AC, migration decision, DoD
  - หลักฐานว่า spec commit มาก่อน PR implementation (screenshot วันที่ commit)

Answer Part 3: Test DD and Traceability (10 pts)
  - Link + เนื้อหา tests.md
  - AC traceability table
  - ผลรัน unit/API/UI/authz/regression/E2E ทั้งหมด (screenshot terminal/CI)

Answer Part 4: AI Use with Reflection (5 pts)
  - ai-use.md: บอกชื่อ LLM ที่ใช้ (Antigravity, Codex, Claude) + 6-10 prompt เด่น
  - "My Reflection" สั้นๆ ว่าใช้ agent แต่ละตัวช่วยอะไรบ้าง

Answer Part 5: Working Login and Password Change UI (5 pts)
  - screenshot ตามจุดที่ระบุใน Phase 4

Answer Part 6: Working IT Staff Ticket Queue UI (5 pts)
  - screenshot ตามจุดที่ระบุใน Phase 6 (+ Requester regression evidence)

Answer Part 7: Working IT Staff Ticket Detail UI (10 pts)
  - screenshot ตามจุดที่ระบุใน Phase 7

Answer Part 8: Working Administrator User Management UI (5 pts)
  - screenshot ตามจุดที่ระบุใน Phase 8

Answer Part 9: Zen Green UI and Responsive Evidence (5 pts)
  - screenshot desktop/tablet/mobile ทุกหน้าหลัก + checklist ที่ทำครบ
```

**Tip:** สร้างโฟลเดอร์ `artifacts/lab-03/screenshots/` ตามโครงที่ handout กำหนดไว้แล้ว (authentication/, staff-queue/, staff-ticket-detail/, user-management/) เก็บภาพเข้าโฟลเดอร์ทันทีหลังทำแต่ละ Phase เสร็จ อย่ารอไปแคปทีเดียวตอนท้าย เพราะข้อมูล seed/state อาจเปลี่ยนไปแล้ว

---

## ส่วนที่ 4 — PR Description Template (ให้เพื่อนรีวิวตาม requirement เรา)

ใช้ template นี้ทุก PR เพื่อให้เพื่อนรีวิวไวและตรงจุด ไม่ต้องเดาว่าต้องเช็คอะไร:

```markdown
## Scope
(1-2 บรรทัด: PR นี้ทำอะไร, อ้าง Issue #)

## Requirement ที่ต้องตรวจ (เพื่อนช่วย confirm ทีละข้อ)
- [ ] Server-side authorization: endpoint นี้เช็ค role/ownership ที่ backend จริงไหม
      (ไม่ใช่แค่ซ่อนปุ่มฝั่ง UI) — ดูที่ไฟล์: `xxx.controller.ts` บรรทัด xx
- [ ] Business rules ที่เกี่ยวข้อง (ระบุ BR-xx ที่ endpoint นี้ต้อง enforce)
- [ ] Input validation: reject ค่าว่าง/รูปแบบผิด ก่อนลง DB
- [ ] Error handling: แยก 401/403/404/409/500 ชัดเจน ไม่ leak ข้อมูล resource คนอื่น
- [ ] Password/secret: ไม่มี plaintext, ไม่มี secret hardcode ในโค้ด
- [ ] Test ที่แนบมาครอบคลุม AC-xx, AC-xx (ลิงก์ไฟล์ test)
- [ ] Regression: รัน suite เดิมแล้วผ่าน (แนบผลลัพธ์)

## Test evidence
(แปะผลรัน test หรือ screenshot terminal)

## Screenshot (ถ้ามี UI เปลี่ยน)
(แปะภาพ before/after)
```

**หลักการ security ที่ยึดสำหรับ Lab นี้ (ระดับพื้นฐาน พอสำหรับ course):**
- Hash password (bcrypt/argon2) — ต้องมี
- Server-side authz ทุก endpoint — ต้องมี (เป็นจุดตัดคะแนนหลักของ handout)
- Validate input ฝั่ง backend — ต้องมี
- ไม่ commit secret — ต้องมี
- ไม่ต้องทำ: rate limiting, CSRF token ขั้นสูง, 2FA, encryption at rest, WAF ฯลฯ (เกิน scope Lab ตาม 4.2 Explicitly Excluded)

---

## ส่วนที่ 5 — วิธีรีวิว PR ของเพื่อนแบบไม่ต้องอ่านโค้ดทุกบรรทัด

เป้าหมาย: ใช้เวลาน้อยแต่จับจุดเสี่ยงได้ครบ (auth/authz คือจุดที่กรรมการให้คะแนนเข้มสุด)

### ขั้นตอน

1. **ให้ AI ช่วยสรุป diff ก่อน** — copy diff จาก PR ของเพื่อน (หรือ `gh pr diff <number>`) แล้วป้อนให้ Claude/Codex พร้อม prompt แบบนี้:

   ```
   นี่คือ diff ของ PR ใน role-based ticketing system (CPE334 Lab3)
   ช่วยตรวจตาม checklist นี้ แล้วสรุปเป็นข้อๆ ว่าผ่าน/ไม่ผ่าน/ไม่แน่ใจ:
   1. endpoint ที่แก้ มีการเช็ค role/ownership ที่ backend จริงไหม
   2. มีจุดไหนที่เชื่อ input จาก client โดยไม่ validate ไหม (เช่น requesterId, role)
   3. error message มีการ leak ข้อมูลของ resource คนอื่นไหม
   4. password/secret ถูกจัดการปลอดภัยไหม
   5. มี business rule ตัวไหนที่ควร enforce แต่หายไปไหม
   [แปะ diff]
   ```

2. **อ่านเฉพาะจุดที่ AI ตอบว่า "ไม่ผ่าน" หรือ "ไม่แน่ใจ"** ด้วยตาตัวเอง — ลดเวลาจากอ่านทั้ง PR เหลือแค่อ่าน 2-5 จุดที่เสี่ยงจริง
3. **เช็คว่า test แนบมาครบตาม AC ที่ PR อ้างถึงไหม** — ไม่ต้องรันเองทุกครั้งถ้าเพื่อนแปะผลลัพธ์ CI/terminal มาให้แล้ว แต่สุ่มรันเองบ้างเป็นบางครั้ง (เช่น PR auth หรือ admin ที่เสี่ยงสูง ควรรันเองอย่างน้อย 1 ครั้ง)
4. **comment ใน PR แบบอ้างอิงบรรทัด/checklist ที่ให้เพื่อนตั้งไว้** — ตอบเป็นข้อ ตรงตาม template ที่เพื่อนเขียนมา ไม่ต้อง comment ยาวเป็นพารากราฟ
5. เก็บ link ของทุก comment ที่ให้ไว้ ใช้ทำ `reviewer.md` ของตัวเองได้เลย

### กฎเวลา (กันภาระซ้อนกับงานตัวเอง)
- รีวิว PR เพื่อนทันทีหลัง merge งานตัวเองในแต่ละ Phase (ใช้จังหวะ merge ของตัวเองเป็นตัวเตือน)
- ตั้งเวลา cap ไว้ เช่น "รีวิว 1 PR ไม่เกิน 15-20 นาที" ถ้าเกินและยังไม่มั่นใจ ให้ mark `status:needs-review` พร้อม comment ระบุจุดที่สงสัยไว้ก่อน แล้วกลับมาต่อทีหลัง ไม่ต้องนั่งเคลียร์รวดเดียว
