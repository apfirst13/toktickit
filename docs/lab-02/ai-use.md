# Lab 2 AI Use and Reflection

**LLM/Agent Used:** Gemini

## Selected Key Prompts (6–10)

| No. | Purpose | Actual Prompt / Summary | My Reflection / Action Taken |
| :---: | :--- | :--- | :--- |
| 1 | Plan Lab 2 Strategy | "ช่วยวางแผนการทำ Lab 2 และลำดับขั้นตอนแต่ละ Issue ตาม Git Flow" | เข้าใจลำดับการแตก Branch และการทำ PR ได้ชัดเจน |
| 2 | Draft Specifications | "Act as an AI Specification Agent... draft docs/lab-02/specification.md" | ได้ข้อกำหนด FR, BR และ AC ครบถ้วนตามโจทย์ |
| 3 | API Specification | "Design RESTful API contracts for Ticket Management and Attachments" | ได้รูปแบบ Request/Response สำหรับนำไปเขียน Route |
| 4 | Database & Seed | "Design Prisma schema for Ticket, Attachment, RequesterUser and seed data" | สร้าง Model และ Seed ข้อมูลตั้งต้นได้ถูกต้อง |
| 5 | Ticket Implementation | "Implement Ticket Detail and Attachment upload/download/soft-remove" | ช่วยเขียนโค้ดและจัดการ Client/Server Validation |
| 6 | Automated Tests | "Write Vitest and Supertest cases covering 100% passing tests" | ได้ Test Cases ครบทั้ง Unit, API และ UI Components |

## Reflection
การใช้ AI ช่วยให้วางโครงสร้าง API และจัดการ Business Rules ที่ซับซ้อนได้อย่างรวดเร็ว โดยเฉพาะการตั้งค่า Validation และ Soft-removal อย่างไรก็ตาม จำเป็นต้องตรวจสอบความถูกต้องของการตั้งค่า Git Flow และตรวจทานสเปกให้ตรงกับข้อกำหนดจริงของโปรเจกต์เสมอ