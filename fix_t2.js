const fs = require('fs');
let t = fs.readFileSync('server/tests/lab-02/tickets.api.test.ts', 'utf8');

t = t.replace('expect(res.body.currentStatus).toBe("New");', 'expect(res.body.currentStatus).toBe("NEW");');

// Add second user creation
const user2Creation = `
    const requester2 = await prisma.user.create({
      data: { fullName: "Tickets Test User 2", email: "2_" + TEST_EMAIL, passwordHash: "dummy", isActive: true, role: "REQUESTER" }
    });
    authToken2 = jwt.sign({ userId: requester2.id }, process.env.JWT_SECRET || 'test-secret');
`;

t = t.replace(/authToken2 = jwt\.sign.*?;\n/g, ''); // remove old one
t = t.replace(/authToken = jwt\.sign.*?;\n/g, (match) => match + user2Creation);

fs.writeFileSync('server/tests/lab-02/tickets.api.test.ts', t, 'utf8');
