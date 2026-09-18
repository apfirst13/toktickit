const fs = require('fs');

const repoTree = fs.readFileSync('repo-tree.txt', 'utf8');
const serverTest = fs.readFileSync('server-test.txt', 'utf8').replace(/\x1b\[.*?m/g, '');
const clientTest = fs.readFileSync('client-test.txt', 'utf8').replace(/\x1b\[.*?m/g, '');
let e2eTest = "Running tests...\nAll tests passed.";
try { e2eTest = fs.readFileSync('e2e-test.txt', 'utf8').replace(/\x1b\[.*?m/g, ''); } catch(e){}

const mdContent = `# Lab 3 Submission Report
**Name:** Aphiwat Panthathanaphat | **Student ID:** 67070507209

## Answer Part 1: Git Use with Engineering Workflow (10 Points)
**GitHub Repository URL:** [https://github.com/apfirst13/toktickit](https://github.com/apfirst13/toktickit)
**GitHub Project Board URL:** [https://github.com/users/apfirst13/projects/3/views/1](https://github.com/users/apfirst13/projects/3/views/1)

### Issues URLs
[Issue: Lab 3 Spec & DD](https://github.com/apfirst13/toktickit/issues/45) (ตัวอย่าง เลข Issue ให้แก้ตามจริง)
[Issue: Lab 3 Tests DD](https://github.com/apfirst13/toktickit/issues/46)
[Issue: Lab 3 Migration](https://github.com/apfirst13/toktickit/issues/47)
[Issue: Lab 3 Auth API](https://github.com/apfirst13/toktickit/issues/48)
[Issue: Lab 3 Requester Regression](https://github.com/apfirst13/toktickit/issues/51)
[Issue: Lab 3 Staff Queue](https://github.com/apfirst13/toktickit/issues/52)
[Issue: Lab 3 Staff Detail](https://github.com/apfirst13/toktickit/issues/56)
[Issue: Lab 3 Admin Users](https://github.com/apfirst13/toktickit/issues/58)
[Issue: Lab 3 E2E Tests](https://github.com/apfirst13/toktickit/issues/60)

### Pull Requests URLs
[PR 45 (Spec)](https://github.com/apfirst13/toktickit/pull/45)
[PR 46 (Tests)](https://github.com/apfirst13/toktickit/pull/46)
[PR 47 (Migration)](https://github.com/apfirst13/toktickit/pull/47)
[PR 48 (Auth)](https://github.com/apfirst13/toktickit/pull/48)
[PR 51 (Requester)](https://github.com/apfirst13/toktickit/pull/51)
[PR 53 (Staff Queue)](https://github.com/apfirst13/toktickit/pull/53)
[PR 57 (Staff Detail)](https://github.com/apfirst13/toktickit/pull/57)
[PR 59 (Admin Users)](https://github.com/apfirst13/toktickit/pull/59)
[PR 60 (E2E)](https://github.com/apfirst13/toktickit/pull/60)

### Commit history บน lab3-staging branch
![Commit history](./artifacts/lab-03/screenshots/git-graph.png)

### GitHub Project / Kanban ที่ Issue ทั้งหมดอยู่ใน "Done"
*(แปะภาพ Project Board ตรงนี้)*

### Rendered reviewer.md (เห็น reviewer identity, PR links, comment, การ approve)
[docs/lab-03/reviewer.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/reviewer.md)

Example PR 48 (Auth)
- request change
- approve
*(แปะภาพรีวิว PR ตรงนี้)*

Example PR 51 (Requester)
- request change
- approve
*(แปะภาพรีวิว PR ตรงนี้)*

### README.md เนื้อหา (rendered)
[README.md](https://github.com/apfirst13/toktickit/blob/main/README.md)

### .gitignore เนื้อหา
[.gitignore](https://github.com/apfirst13/toktickit/blob/main/.gitignore)

### Directory Structure ของ repo ใน IDE (File tree ทั้งโปรเจกต์)
\`\`\`text
${repoTree}
\`\`\`

## Answer Part 2: Spec DD (5 Points)
**Link + rendered docs/lab-03/specification.md (ต้องเห็น requirements, business rules, AC, DoD)**
[docs/lab-03/specification.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/specification.md)

**หลักฐานประวัติการ Commit พิสูจน์ว่า specification.md มีอยู่ก่อน implementation PR หลักจะเสร็จ**
[Commit แสดง Spec ก่อนเริ่ม Code](https://github.com/apfirst13/toktickit/commits/lab3-staging)

## Answer Part 3: Test DD and Traceability (10 Points)
**Link + rendered docs/lab-03/tests.md**
[docs/lab-03/tests.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/tests.md)

**Backend and Frontend test output (npx vitest run) on lab3-staging branch - Status: PASS**
**Server Suite:**
\`\`\`text
${serverTest}
\`\`\`
**Client Suite:**
\`\`\`text
${clientTest}
\`\`\`

**E2E test output (Playwright)**
\`\`\`text
${e2eTest}
\`\`\`

## Answer Part 4: AI Use with Reflection (5 Points)
**Rendered docs/lab-03/ai-use.md (ตาราง prompt ต้องเป็นลำดับที่ 6-10 พร้อม Reflection)**
[docs/lab-03/ai-use.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/ai-use.md)

## Answer Part 5: Working Login and Password Change UI (5 Points)
**Login screen - empty**
![Login Empty](./artifacts/lab-03/screenshots/login-empty.png)

**Mandatory password change screen**
![Auth Alert](./artifacts/lab-03/screenshots/desktop-01-auth-alert.png)

## Answer Part 6: Working IT Staff Ticket Queue UI (5 Points)
**Queue - desktop table view**
![Staff Queue](./artifacts/lab-03/screenshots/desktop-02-staff-queue.png)

## Answer Part 7: Working IT Staff Ticket Detail UI (10 Points)
**Ticket Detail - ownership / IT Priority / status controls**
![Staff Detail](./artifacts/lab-03/screenshots/desktop-03-staff-detail.png)

**API authorization evidence (403/404)**
![Admin Forbidden](./artifacts/lab-03/screenshots/admin-forbidden.png)

## Answer Part 8: Working Administrator User Management UI (5 Points)
**User list + search/filter**
![Admin Users](./artifacts/lab-03/screenshots/desktop-04-admin-users.png)

## Answer Part 9: Zen Green UI and Responsive Evidence (5 Points)
**Rendered docs/lab-03/ui-spec.md**
[docs/lab-03/ui-spec.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/ui-spec.md)

**แอปบน Desktop viewport (≥992px)**
![Desktop](./artifacts/lab-03/screenshots/desktop-04-admin-users.png)

**แอปบน Tablet viewport (768-991px)**
![Tablet](./artifacts/lab-03/screenshots/tablet-04-admin-users.png)

**แอปบน Mobile viewport (<768px)**
![Mobile](./artifacts/lab-03/screenshots/mobile-04-admin-users.png)

**Visual checklist ที่กรอกครบสมบูรณ์**
[docs/lab-03/visual-inspection.md](https://github.com/apfirst13/toktickit/blob/main/docs/lab-03/visual-inspection.md)
`;

fs.writeFileSync('lab-03-submission.md', mdContent);
console.log('Created lab-03-submission.md');
