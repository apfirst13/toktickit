const fs = require('fs');

let t = fs.readFileSync('server/tests/lab-02/tickets.api.test.ts', 'utf8');

t = t.replace(/prisma\.requesterUser/g, 'prisma.user');
t = t.replace(/import \{ prisma \} from \"\.\.\/\.\.\/src\/prisma\.js\";/g, 'import { prisma } from "../../src/prisma.js";\nimport jwt from "jsonwebtoken";');
t = t.replace(/let systemId: number;/g, 'let systemId: number;\nlet authToken: string;');
t = t.replace(/name: "Tickets Test User"/g, 'fullName: "Tickets Test User", passwordHash: "dummy", role: "REQUESTER"');
t = t.replace(/requesterId = requester\.id;/g, "requesterId = requester.id;\n    authToken = jwt.sign({ userId: requesterId }, process.env.JWT_SECRET || 'test-secret');");

t = t.split('?requesterId=${requesterId + 999}').join('');
t = t.split('?requesterId=${requesterId}').join('');
t = t.split('requesterId,\n').join('');
t = t.split('requesterId: requesterId + 999,\n').join('');

const authStr = '\n        .set("Authorization", "Bearer " + authToken)';
t = t.split('.post("/api/tickets")').join('.post("/api/tickets")' + authStr);
t = t.split('.get(`/api/tickets`)').join('.get(`/api/tickets`)' + authStr);
t = t.split('.get("/api/tickets")').join('.get("/api/tickets")' + authStr);
t = t.split('.post(`/api/tickets/${ticketId}/attachments`)').join('.post(`/api/tickets/${ticketId}/attachments`)' + authStr);
t = t.split('.get(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`)').join('.get(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`)' + authStr);
t = t.split('.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`)').join('.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`)' + authStr);
fs.writeFileSync('server/tests/lab-02/tickets.api.test.ts', t, 'utf8');

let cRoute = fs.readFileSync('server/src/routes/tickets.routes.ts', 'utf8');
cRoute = cRoute.replace(/cb\(null,\s*\`.*?(\)|;)/g, 'cb(null, \`${crypto.randomUUID()}${path.extname(file.originalname)}\`);');
fs.writeFileSync('server/src/routes/tickets.routes.ts', cRoute, 'utf8');

let cCtrl = fs.readFileSync('server/src/controllers/tickets.controller.ts', 'utf8');
cCtrl = cCtrl.replace(/const fileUrl = \/uploads\/\\;/g, 'const fileUrl = \`/uploads/${req.file.filename}\`;');
cCtrl = cCtrl.replace(/res\.setHeader\(\"Content-Disposition\",\s*\\.*?\\\"\);/g, 'res.setHeader("Content-Disposition", \`attachment; filename="${attachment.fileName}"\`);');
fs.writeFileSync('server/src/controllers/tickets.controller.ts', cCtrl, 'utf8');
