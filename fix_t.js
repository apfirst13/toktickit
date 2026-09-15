const fs = require('fs');
let t = fs.readFileSync('server/tests/lab-02/tickets.api.test.ts', 'utf8');

t = t.replace(/prisma\.requesterUser/g, 'prisma.user');
t = t.replace(/import \{ prisma \} from \"\.\.\/\.\.\/src\/prisma\.js\";/g, 'import { prisma } from "../../src/prisma.js";\nimport jwt from "jsonwebtoken";');

t = t.replace(/let systemId: number;/g, 'let systemId: number;\nlet authToken: string;\nlet authToken2: string;');

t = t.replace(/name: "Tickets Test User"/g, 'fullName: "Tickets Test User", passwordHash: "dummy", role: "REQUESTER"');

const authGen = `requesterId = requester.id;
    authToken = jwt.sign({ userId: requesterId }, process.env.JWT_SECRET || 'test-secret');
    authToken2 = jwt.sign({ userId: requesterId + 999 }, process.env.JWT_SECRET || 'test-secret');`;
t = t.replace(/requesterId = requester\.id;/g, authGen);

t = t.replace(/\?requesterId=\$\{requesterId \+ 999\}/g, '');
t = t.replace(/\?requesterId=\$\{requesterId\}/g, '');

t = t.replace(/const res = await request\(app\)\.get\(`\/api\/tickets`\);/g, 'const res = await request(app).get(`/api/tickets`).set("Authorization", "Bearer " + authToken2);');
t = t.replace(/const res2 = await request\(app\)\.get\(`\/api\/tickets`\);/g, 'const res2 = await request(app).get(`/api/tickets`).set("Authorization", "Bearer " + authToken);');

// Remove body requesterId
t = t.replace(/requesterId: requesterId \+ 999,\n/g, '');
t = t.replace(/requesterId,\n/g, '');

t = t.replace(/\.post\("\/api\/tickets"\)/g, '.post("/api/tickets").set("Authorization", "Bearer " + authToken)');
t = t.replace(/\.post\(`\/api\/tickets\/\$\{ticketId\}\/attachments`\)/g, '.post(`/api/tickets/${ticketId}/attachments`).set("Authorization", "Bearer " + authToken)');
t = t.replace(/\.get\(`\/api\/tickets\/\$\{ticketId\}\/attachments\/\$\{attachmentId\}\/download`\)/g, '.get(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`).set("Authorization", "Bearer " + authToken)');
t = t.replace(/\.delete\(`\/api\/tickets\/\$\{ticketId\}\/attachments\/\$\{attachmentId\}`\)/g, '.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`).set("Authorization", "Bearer " + authToken)');

// Special case for the "invalid requesterId" test which used requesterId + 999
t = t.replace(/\.post\("\/api\/tickets"\)\.set\("Authorization", "Bearer " \+ authToken\)\n      \.send\(\{[\s\S]*?ticketId\+999[\s\S]*?\}\);/g, (match) => {
    // Actually we just replace the body sending part if needed. Wait, we already removed `requesterId` from bodies!
    // But how to test invalid requester? We use `authToken2`.
    return match; // Let's just fix it manually if it fails
});

fs.writeFileSync('server/tests/lab-02/tickets.api.test.ts', t, 'utf8');
