# AI Assistance Log & Reflection

## LLM Tools Used
- Claude / Gemini / Antigravity IDE

## Key Prompts Table

| No. | Purpose | Prompt Summary | Output Quality / Action Taken |
|---|---|---|---|
| 1 | Workflow Initialization | "เริ่ม issue 8 เลยระบบการทำงานเหมือนตอนเริ่มissue ก่อนๆ อย่าcommit" | AI set up the branch correctly and respected the boundary to not commit autonomously. |
| 2 | Review Resolution | "เวลาแก้ไขrequest change จากเพื่อน ให้ทำ markdown สิ่งที่แก้ไปด้วย" | AI successfully generated a clear markdown summary of changes alongside the code fixes for peer review. |
| 3 | Git Troubleshooting | "บน github ผมยังไม่เห็นbranchใหม่เปิด pr ไม่ได้" | AI analyzed the local/remote branch sync issue and provided the correct push commands to resolve it. |
| 4 | Project Structure | "ได้ทำ folder aftifact เก็บรูปไว้ไหม" | AI confirmed the artifact directory structure and successfully organized the project screenshots. |
| 5 | Git Graph Formatting | "เปลี่ยน ชื่อ branchทั้งหมด ให้ไปทางเดียวกันlayout เดียวกันหน่อย" | AI cleanly renamed branches in the Git history to enforce a consistent naming convention. |
| 6 | History Rewrite | "ทำไมยังเห็น graph ซ้ำโผล่มาแทรก" | AI investigated the overlapping commits and performed a deep rebase to restore a clean staircase history. |
| 7 | Workflow Enforcement | "เรื่อง git push อย่าทำเอง ยกเลิก merge issue 8 ก่อน" | AI immediately halted the unauthorized merge and reverted the workflow to await peer review. |
| 8 | Sequential Development | "ตรง issue 6 ควร megre เข้า lab3 แล้วค่อย ไป issue 7" | AI realigned with the sequential workflow requirement, ensuring one issue is fully merged before branching the next. |
| 9 | Automated Documentation | "สร้าง html ที่แปะรูปและลิ้งครบ" | AI generated a complete HTML submission report integrating all screenshots, links, and terminal outputs. |
| 10 | Testing & QA | "คุณทำ test ไม่ครบหลอ ทำไม server ต้องทำ อีก กำลังทำเอกสารเลย" | AI identified the skipped skeleton test file, removed it, and delivered a 100% clean and passing test suite. |

---

## My Reflection

จากการใช้งาน AI ในฐานะ Pair-programming Assistant และ Autonomous Agent ตลอด Lab 3 พบประเด็นที่น่าสนใจดังนี้:

### จุดแข็ง (Strengths)
1. **การวิเคราะห์และแก้ไขปัญหาโค้ดอัตโนมัติ:** เมื่อ E2E Test รันไม่ผ่าน AI มีความสามารถในการอ่าน Log (เช่น `text=IT Staff Queue` หาไม่เจอ) และสืบค้นกลับไปยัง Component ต้นทาง (`StaffTicketQueue.tsx`) เพื่อหาสาเหตุที่แท้จริง และเสนอวิธีแก้ไข (เช่น การปรับ Locator สำหรับ Responsive Viewport แบบ Card) ได้อย่างแม่นยำ
2. **การจัดการ Testing Framework (Playwright):** AI สามารถเขียน E2E Test แบบ Full Flow ตั้งแต่จำลองการสร้างข้อมูลในฐานข้อมูล (Seed/API) ไปจนถึงการกด UI ครอบคลุมทั้งกรณี Desktop, Tablet, และ Mobile ได้รวดเร็วกว่าการเขียนด้วยมือมาก
3. **การจัดการ Git Workflow:** เมื่อเกิดข้อผิดพลาดในการ Push หรือมี Branch ซ้อนทับกัน AI สามารถใช้วิธีรัน Command เพื่อตรวจสอบสถานะ Branch (เช่น `git log`, `git show`) อธิบายปัญหาให้เข้าใจได้ง่าย และช่วย Force Reset หรือ Merge ให้กลับมาอยู่ในสถานะปกติได้ทันที

### ข้อจำกัดและบทเรียน (Limitations & Lessons Learned)
1. **ความระมัดระวังในการทำ Automated Commits:** การให้ AI รัน `git commit` อาจทำให้เกิดปัญหาหากไม่ตรวจสอบให้ดี เช่น การติดไฟล์ขยะ (`scratch_replace.js`) หรือไฟล์ไม่ครบถ้วนเข้าไปใน Commit ทำให้ต้องมานั่ง Revert หรือลบออกทีหลัง การระบุเงื่อนไขให้ชัดเจน (เช่น *"อย่า commit จนกว่าจะสั่ง"*) จึงเป็นกลยุทธ์สำคัญ
2. **Context Synchronization:** AI อาจไม่ทราบว่าผู้ใช้แอบทำการ Commit หรือ Merge โค้ดจากฝั่ง GitHub UI ด้วยตนเอง ทำให้เกิดสถานการณ์ "Conflict ทางความเข้าใจ" ผู้ใช้จึงควรแจ้ง AI เสมอเมื่อมีการกระทำภายนอก
3. **การประเมิน Visual Layout แบบ Automated:** แม้ AI จะถ่ายภาพหน้าจอด้วย Playwright ได้รวดเร็ว แต่ไม่สามารถ "ใช้ตามอง" เพื่อประเมินความสวยงามได้ ผู้พัฒนาจึงยังต้องเป็นคนเปิดไฟล์ Screenshot มาตรวจเช็ค (Visual Checklist) ว่าสัดส่วน หรือสีสันตรงตามคู่มือ UI หรือไม่

**สรุป:** การใช้ AI ในวิชาซอฟต์แวร์เอนจิเนียริงช่วยลดเวลาในการเขียน Test (Boilerplate) และการ Debug ข้อมูลที่ซับซ้อนได้อย่างมาก แต่จำเป็นต้องมีคนมาตรวจสอบ
