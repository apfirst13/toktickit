const fs = require('fs');
let content = fs.readFileSync('server/tests/lab-02/tickets.api.test.ts', 'utf8');

content = content.replace(/prisma\.requesterUser/g, 'prisma.user');
content = content.replace(/import \{ prisma \} from "\.\.\/\.\.\/src\/prisma\.js";/g, 'import { prisma } from "../../src/prisma.js";\nimport jwt from "jsonwebtoken";');
content = content.replace(/let systemId: number;/g, 'let systemId: number;\nlet authToken: string;');
content = content.replace(/name: "Tickets Test User"/g, 'fullName: "Tickets Test User", passwordHash: "dummy", role: "REQUESTER"');
content = content.replace(/requesterId = requester\.id;/g, "requesterId = requester.id;\n    authToken = jwt.sign({ userId: requesterId }, process.env.JWT_SECRET || 'test-secret');");

// Remove requesterId queries and body params
content = content.replace(/\?requesterId=\$\{?[a-zA-Z0-9_\+]+\}?/g, '');
content = content.replace(/requesterId,\n/g, '');
content = content.replace(/requesterId: requesterId \+ 999,\n/g, '');

// Append .set("Authorization", \Bearer \\) to endpoints
const authSet = '\n        .set("Authorization", Bearer )';
content = content.replace(/\.post\("\/api\/tickets"\)/g, '.post("/api/tickets")' + authSet);
content = content.replace(/\.get\(\/api\/tickets\)/g, '.get(/api/tickets)' + authSet);
content = content.replace(/\.get\("\/api\/tickets"\)/g, '.get("/api/tickets")' + authSet);
content = content.replace(/\.post\(\/api\/tickets\/\$\{ticketId\}\/attachments\)/g, '.post(/api/tickets//attachments)' + authSet);
content = content.replace(/\.get\(\/api\/tickets\/\$\{ticketId\}\/attachments\/\$\{attachmentId\}\/download\)/g, '.get(/api/tickets//attachments//download)' + authSet);
content = content.replace(/\.delete\(\/api\/tickets\/\$\{ticketId\}\/attachments\/\$\{attachmentId\}\)/g, '.delete(/api/tickets//attachments/)' + authSet);

fs.writeFileSync('server/tests/lab-02/tickets.api.test.ts', content, 'utf8');
