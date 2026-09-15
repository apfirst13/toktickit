# Lab 3 — PR Review Checklist (Reusable ทุก Issue)

> ใช้ไฟล์นี้เป็น Gate ก่อนขออนุมัติทุก Issue ตั้งแต่นี้เป็นต้นไป
> Agent ต้อง **รันเช็คลิสต์นี้เองและตอบทุกข้อ** ก่อนส่งมาให้ User อนุมัติ
> ถ้าข้อไหนตอบไม่ได้/ไม่แน่ใจ ให้ถือว่ายังไม่ผ่าน ห้ามข้าม

---

## Section A: Universal Gates (บังคับทุก Issue)

### A1. Authentication & Authorization
- [ ] ทุก endpoint ใหม่ผ่าน `authenticate` middleware แล้ว (ไม่มี route ที่หลุดออกไปแบบ public โดยไม่ตั้งใจ)
- [ ] Role check ใช้ `req.user.role` ที่มาจาก token เท่านั้น ไม่ใช่ค่าจาก body/query/header ที่ client ส่งมา
- [ ] ถ้า endpoint จำกัดเฉพาะบาง role (เช่น IT Staff, Administrator) — ระบุชัดว่า role ไหนเข้าได้บ้าง และตรงกับ **ตาราง 4.3 Required Roles and Authorization** ในสเปก ไม่ใช่เดาเอง
- [ ] Ownership check (ถ้ามี) ใช้ `req.user.id` เท่านั้น

### A2. Safe Errors (ตาม Section 6.2 ของสเปก)
- [ ] ไม่มี token เลย → **401**
- [ ] มี token แต่ role ไม่มีสิทธิ์เข้า endpoint นี้เลย (role-level forbidden) → **403**
- [ ] มี token, role ถูกต้อง แต่ resource ไม่ใช่ของตัวเอง/ไม่มีสิทธิ์เฉพาะ record นั้น (ownership-level forbidden) → **404** (ไม่ leak ว่า resource มีอยู่จริง — ตามที่ตกลงกันไว้ใน Issue 5)
- [ ] Input ไม่ผ่าน validation → **400** พร้อม message ที่ไม่ leak ข้อมูล internal
- [ ] หา resource ไม่เจอจริงๆ → **404**
- [ ] ข้อมูลซ้ำ/ชนกัน (เช่น duplicate email) → **409**
- [ ] **ระบุชัดเจนว่า 403 กับ 404 ใช้ต่างกันตรงไหนใน endpoint นี้** (role-level ต่าง resource-level)

### A3. Data / Migration (ถ้ามีแก้ schema)
- [ ] ใช้ `prisma migrate dev --name <ชื่อสื่อความหมาย>` เท่านั้น ห้ามใช้ `db push`
- [ ] Migration file ถูก commit เข้า repo แล้ว
- [ ] Seed data อัปเดตให้ตรงกับ schema ใหม่ และยังรันซ้ำได้ (idempotent) โดยไม่กระทบข้อมูลเดิม

### A4. Test Coverage
- [ ] ทุก AC ที่เกี่ยวข้องกับ Issue นี้มี automated test อ้างอิงชัดเจน (ระบุ Test ID ↔ AC ID)
- [ ] มี test ครบ: success case, 401, 403 (ถ้ามี role gate), 404 (ถ้ามี ownership gate), validation error
- [ ] รายงานตัวเลข **before/after**: มี test กี่ข้อก่อนเริ่ม Issue นี้ → กี่ข้อหลังทำเสร็จ (ไม่ใช่แค่บอกยอดรวมสุดท้าย)
- [ ] ถ้ามี test แบบ `.todo`/`.skip` ค้างอยู่ — ระบุว่าเป็นของ Issue ไหน จะทำเมื่อไหร่ ไม่ปล่อยเงียบ

### A5. Scope Control
- [ ] ไฟล์ที่แก้ไข **ตรงกับ scope ที่ระบุใน Issue เท่านั้น**
- [ ] ถ้าจำเป็นต้องแตะไฟล์นอก scope (เช่น `app.ts` เพื่อ mount route) — ต้องแจ้งเหตุผลและขออนุมัติเฉพาะจุดนั้นก่อนแก้ ไม่ใช่แก้แล้วค่อยแจ้งทีหลัง
- [ ] ไม่มีการ refactor ส่วนอื่นที่ไม่เกี่ยวข้องแฝงมาด้วย

### A6. Documentation Traceability
- [ ] `docs/lab-03/api-spec.md` อัปเดตให้ตรงกับ endpoint ที่ implement จริง (path, method, query params, response shape)
- [ ] `docs/lab-03/tests.md` อัปเดต status ของ test ที่เกี่ยวข้อง (Todo → Pass)

---

## Section B: Feature-Specific Checks (เติมตาม Issue)

### สำหรับ Queue / List API (เช่น Issue 6 Staff Queue, Issue 8 User List)
- [ ] Pagination: มี default + max limit ชัดเจน, invalid input fallback ไป default ไม่ error
- [ ] Sorting: sortBy ผ่าน whitelist ป้องกัน injection, invalid sortBy fallback ไป default field
- [ ] Search: ระบุ field ที่ search ได้ชัดเจน ตรงกับที่ประกาศใน spec (section 6.3)
- [ ] Filter: ระบุ field ที่ filter ได้ (status, priority, category, owner ฯลฯ) — เช็คว่าครบตามที่สเปกต้องการ ไม่ใช่แค่ search+sort+pagination
- [ ] Response มี pagination metadata (total count, page, pageSize) ตามที่ตกลงไว้ใน api-spec.md
- [ ] Invalid query param (เช่น page=-1, limit=99999) มี behavior ที่กำหนดไว้ชัดและมี test

---

## Section C: Approval Decision

- [ ] **Approved as-is** — ผ่านทุกข้อ พร้อม merge
- [ ] **Approved with conditions** — ระบุเงื่อนไขที่ต้องแก้ก่อน merge จริง (list ด้านล่าง)
- [ ] **Rejected / Needs rework** — ระบุเหตุผล

---
---

# Applied Review: Issue 6 — IT Staff Ticket Queue (Backend)

**สถานะ: 🟡 Approved with conditions — ยังไม่ให้เริ่ม Frontend จนกว่าจะตอบครบข้อที่ยังค้างด้านล่าง**

## A1. Authentication & Authorization
- [x] `authenticate` middleware ถูกใช้ (ยืนยันจาก summary ว่ามี `requireRole` เพิ่มเข้ามา)
- [ ] **ยังไม่ชัด**: `requireRole` ที่ใช้กับ `/api/staff/queue` อนุญาต role ไหนบ้าง? ตามตาราง 4.3 IT Staff เข้าได้แน่นอน แต่ Administrator ควรเข้าได้ไหม — สเปกบอกว่า "Administrator ไม่ automatically ได้สิทธิ์ IT Staff เว้นแต่ authorization matrix จะระบุไว้ชัด" **→ ต้องให้ agent ยืนยันว่า authorization matrix ที่ approve ไว้ใน specification.md เขียนเรื่องนี้ไว้ว่าอย่างไร แล้ว code ตรงกันหรือไม่**
- [ ] **ยังไม่ชัด**: Requester role ที่พยายามยิง `/api/staff/queue` ควรได้ 403 (role-level) — มี test ยืนยันเคสนี้หรือยัง (นอกเหนือจาก unauthenticated 401)

## A2. Safe Errors
- [x] มีการพูดถึง "401/403" ใน summary
- [ ] **ต้องยืนยัน**: endpoint นี้เป็น role-level gate ล้วน (ไม่มี resource-level ownership) ดังนั้นควรใช้ 403 ไม่ใช่ 404 เมื่อ role ไม่ตรง — ต่างจาก Issue 5 ที่ใช้ 404 เพราะเป็น resource ownership คนละกรณีกัน **ให้ agent ยืนยันว่าเข้าใจตรงนี้และไม่ได้เผลอใช้ 404 กับ role-forbidden**

## A3. Migration
- [x] ไม่มีการแก้ schema ใน Issue นี้ (ไม่ระบุในรายงาน) → ไม่ต้องเช็ค

## A4. Test Coverage
- [x] มี test เพิ่ม (อ้างว่า 9 ข้อ ครอบคลุม sort/filter/search/pagination/401/403/limit)
- [ ] **ต้องขอ diff ตัวเลขจริง**: ก่อน Issue 6 มี test เท่าไหร่ (suite รวม), หลังทำเสร็จเป็น 42 passed — 9 ข้อที่เพิ่มมาคือส่วนต่างจริงหรือไม่ ขอให้ agent แสดง `git diff --stat` ของไฟล์ test หรือ list ชื่อ test ทั้ง 9 ข้อ
- [ ] **12 todo ที่เหลือคืออะไร** — เป็นของ Issue อื่นที่ยังไม่ถึงคิว หรือเป็นส่วนที่ควรทำใน Issue 6 แต่ยังไม่ทำ? ให้ agent ระบุรายชื่อ todo ทั้ง 12 ข้อ พร้อม map ว่าเป็นของ Issue ไหน

## A5. Scope Control
- [ ] **มีการแก้ `app.ts` อีกครั้ง** (เพื่อ mount `staff.routes.ts`) — เข้าเงื่อนไขเดียวกับที่เคย approve ไว้ใน Issue 5 (แก้เฉพาะส่วน mount router) ให้ agent ยืนยันว่าแก้เฉพาะบรรทัดที่เกี่ยวกับการ mount เท่านั้น ไม่ได้แตะ route อื่นที่ไม่เกี่ยว

## A6. Documentation Traceability
- [ ] `docs/lab-03/api-spec.md` มีการอัปเดต spec ของ `GET /api/staff/queue` แล้วหรือยัง (query params, response shape, sortBy whitelist, filter fields)? ยังไม่เห็นถูกพูดถึงในรายงาน — **ต้องทำก่อนถือว่า Issue 6 backend เสร็จ**

## B. Feature-Specific (Queue API)
- [x] Pagination: มี default + cap 50 — ผ่าน
- [x] Sorting: whitelist ป้องกัน injection, fallback เป็น `createdAt` — ผ่าน
- [x] Search: `ticketNumber`, `summary` แบบ insensitive — ผ่าน
- [ ] **Filter**: รายงานไม่ได้พูดถึง filter (status, category, priority, owner) เลย — สเปก section 8.3/6.3 ต้องการ "search, **suitable filters**, sorting, pagination" ครบทั้ง 4 อย่าง **ถ้ายังไม่ implement filter ให้ทำเพิ่มก่อนปิด Issue 6 backend**
- [ ] **Pagination metadata**: response คืน total count / totalPages / currentPage มาด้วยหรือไม่ — จำเป็นสำหรับ frontend ทำ UI pagination (section 6.3 ต้องการ pagination metadata ชัดเจน)

## Section C: Decision

**🟡 Approved with conditions** — ห้าม merge หรือเริ่ม Frontend จนกว่า agent จะตอบ/แก้ครบ:
1. ยืนยัน role ที่อนุญาตเข้า `/api/staff/queue` ตรงกับ authorization matrix ที่ approve ไว้
2. เพิ่ม test: Requester ยิง endpoint นี้ → ต้องได้ 403 (ถ้ายังไม่มี)
3. ยืนยันว่าไม่ได้ใช้ 404 กับ role-level forbidden (ต้องเป็น 403)
4. แสดง diff ตัวเลข test ก่อน/หลัง + รายชื่อ 12 todo ที่เหลือว่าเป็นของ Issue ไหน
5. เพิ่ม filter (status/category/priority/owner ตามที่ agent เลือกและ justify ไว้ใน ui-spec.md)
6. เพิ่ม pagination metadata ใน response ถ้ายังไม่มี
7. อัปเดต `api-spec.md` ให้ตรงกับ endpoint จริง
8. ยืนยันว่าแก้ `app.ts` เฉพาะส่วน mount router เท่านั้น

หลังแก้ครบ ให้ agent รัน Section A+B ใหม่ทั้งหมดอีกรอบ แล้วรายงานผลเป็นข้อๆ ตามช่องนี้ ก่อนขออนุมัติรอบถัดไป
