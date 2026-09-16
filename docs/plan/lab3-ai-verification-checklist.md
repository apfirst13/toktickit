# เช็คลิสต์ยืนยันผลงาน AI ก่อนเปิด PR — ครบ 11 Issue

ใช้ตารางนี้ทุกครั้งที่ Antigravity/Codex บอกว่า "เสร็จแล้ว" ก่อนเชื่อและเปิด PR — เทียบบทเรียนจาก Issue #2 ที่ agent อ้างว่าสร้าง `auth.api.test.ts` แต่จริงๆ ไม่มี

| # | Issue | ไฟล์ที่ต้องมีจริง (เช็คด้วย `Test-Path`) | จุดที่ AI มักหลอน/พลาด | วิธียืนยันด้วยตัวเอง |
|---|---|---|---|---|
| 1 | Spec DD | `specification.md`, `ui-spec.md`, `api-spec.md` | อ้างว่ามี "authorization matrix"/DoD section แต่จริงๆ ไม่มีหัวข้อนั้นในไฟล์ | `Select-String -Path docs\lab-03\*.md -Pattern "^## "` ดูหัวข้อจริงที่มี |
| 2 | Test DD | `tests.md` + 6 ไฟล์ backend + 5 ไฟล์ frontend + 3 ไฟล์ e2e (ตามชื่อ handout กำหนด) | อ้างว่าสร้างครบแต่ไฟล์บางตัวหาย (เช่น auth.api.test.ts) | `Test-Path` ทีละไฟล์ตามลิสต์แบบเป๊ะ ไม่เชื่อ summary |
| 3 | Migration | `schema.prisma` แก้แล้ว, migration folder ใหม่, seed script | อ้างว่า seed idempotent/hash password แล้ว แต่จริงรันซ้ำแล้วข้อมูลซ้ำ หรือ password เก็บ plaintext | รัน `npx prisma db seed` 2 รอบเทียบจำนวนแถว, `grep -r "bcrypt\|argon2" server/src/` |
| 4 | Auth | login/logout/me/change-password endpoint, `Login.tsx`, `ChangePassword.tsx` | อ้างว่า error message เป็น generic แต่จริง leak ว่า email/password ผิด, อ้างว่า mustChangePassword บังคับแล้วแต่ middleware ไม่ได้ apply จริง | ยิง API ด้วย Postman/curl login ผิดดู response จริง, เช็คว่า middleware ถูก import ใน route ที่ควร |
| 5 | Requester regression | ลบ Dev selector หมด, Ticket/Attachment API ใช้ session identity | อ้างว่าลบ selector แล้วแต่ยังมี reference ค้าง, อ้างว่าใช้ session แต่ยังรับ requesterId จาก body เงียบๆ | `grep -ri "devrequester\|dev-requester"` ทั้ง repo ต้องไม่เจอ, ยิง API ใส่ requesterId ปลอมดูว่าโดน ignore จริง |
| 6 | Staff Queue | queue API (search/filter/sort/pagination), Queue UI | อ้างว่า pagination ทำงานแต่ default page size ไม่ตรง api-spec.md | ยิง API พร้อม query param จริงเทียบ response กับที่ spec กำหนด |
| 7 | Staff Detail | ownership assign, IT Priority, status transition, comments/notes UI แยกสี | อ้างว่า Internal Note บล็อก Requester แล้ว แต่จริงบล็อกแค่ UI (ซ่อนปุ่ม) ไม่ได้เช็คที่ backend | ยิง API `/internal-notes` ด้วย token Requester ตรงๆ ต้องได้ 403/404 ไม่ใช่แค่ UI ไม่แสดง |
| 8 | Admin Users | list/search/filter, create/edit, reset password, self-deactivate guard, last-admin guard | อ้างว่ามี safety guard แต่ enforce แค่ฝั่ง UI (disable ปุ่ม) ไม่ได้เช็คที่ API | ยิง API deactivate ตัวเอง/admin คนสุดท้ายตรงๆ ต้องโดน 400 จาก backend จริง |
| 9 | E2E | e2e spec files ทั้งหมดใน `e2e/lab-03/` | อ้างว่า test ผ่านหมดแต่จริงมี `.skip()`/`.todo()` ค้างอยู่เยอะ | `grep -r "\.skip(\|\.todo(" e2e/lab-03/` ต้องไม่เจอ (หรือเจอน้อยและมีเหตุผลชัดเจน) |
| 10 | Visual Inspection | screenshot ทุกหน้า × 3 breakpoint ในโฟลเดอร์ตามชื่อ handout | อ้างว่าเก็บครบแต่ไฟล์ภาพเป็นของเก่า (ก่อนแก้ UI ล่าสุด) | เช็ควันที่แก้ไฟล์ภาพ (`Get-ChildItem` ดู LastWriteTime) เทียบกับวันที่ merge PR ล่าสุด |
| 11 | Release | `reviewer.md`, `ai-use.md`, ทุก Issue อยู่ Done บน Kanban | อ้างว่า reviewer.md มี evidence ครบแต่จริงยังมี placeholder/TODO ค้าง | `Select-String -Pattern "TODO\|\[Place your content\|\.\.\." -Path docs\lab-03\reviewer.md,docs\lab-03\ai-use.md` |

---

## กฎทองที่ใช้ได้ทุก Issue

1. **ไม่เชื่อคำสรุปของ AI ("เสร็จแล้ว", "ครบแล้ว") จนกว่าจะเช็คไฟล์/รันคำสั่งยืนยันด้วยตัวเอง**
2. **Business rule ที่เกี่ยวกับ authorization ต้องทดสอบด้วยการยิง API ตรงๆ เสมอ** ไม่ใช่แค่ดูว่า UI ซ่อนปุ่มถูกไหม (หลักการ "hiding a button is not authorization" จาก handout)
3. ถ้าพบว่า AI อ้างสิ่งที่ไม่มีอยู่จริง (ไฟล์หาย, section หาย) → สั่งแก้เฉพาะจุดนั้น พร้อมระบุชัดว่าไฟล์/บรรทัดไหนหาย ไม่ต้องให้ทำใหม่ทั้งหมด
