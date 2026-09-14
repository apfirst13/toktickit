const fs = require('fs');
let t = fs.readFileSync('server/tests/lab-02/tickets.api.test.ts', 'utf8');

// 1. Add unauthenticated test for GET /api/tickets
const unauthTest = `
    it("should return 401 Unauthorized when no token is provided", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });
`;

if(!t.includes('should return 401 Unauthorized')) {
  t = t.replace('describe("POST /api/tickets", () => {', 'describe("POST /api/tickets", () => {\n' + unauthTest);
}

// 2. Modify isolation test to check 404 (formerly it returned 200 with 0 length because it was just listing, wait, the GET /api/tickets without ID lists tickets, so it returns 200 with empty array. The 404 is for GET /api/tickets/:id!)
const getTicketByIdTest = `
    it("should return 404 when accessing another user's ticket to prevent existence leak", async () => {
      // Create ticket as user 1
      const created = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
        summary: "Private Ticket",
        description: "This is a private ticket that shouldn't be leaked",
        requestedPriority: "Low",
        categoryId,
        systemId
      });
      const tId = created.body.id;

      // Access as user 2
      const res = await request(app).get(\`/api/tickets/\${tId}\`).set("Authorization", "Bearer " + authToken2);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Ticket not found");
    });
`;

if(!t.includes('prevent existence leak')) {
  t = t.replace('describe("POST /api/tickets", () => {', 'describe("POST /api/tickets", () => {\n' + getTicketByIdTest);
}

// 3. Test that sending requesterId in body is ignored
const ignoreRequesterIdTest = `
    it("should ignore malicious requesterId in body and use token identity (AC-03)", async () => {
      // Send as user 1, but try to assign requesterId of user 2
      const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
        summary: "Malicious Ticket",
        description: "Trying to forge the requester ID",
        requestedPriority: "Low",
        categoryId,
        systemId,
        requesterId: 999999, // Fake ID
        requesterUserId: 999999
      });
      
      expect(res.status).toBe(201);
      // The ticket should be created for user 1, not 999999
      expect(res.body.requesterUserId).toBe(requesterId);
    });
`;

if(!t.includes('should ignore malicious requesterId')) {
  t = t.replace('describe("POST /api/tickets", () => {', 'describe("POST /api/tickets", () => {\n' + ignoreRequesterIdTest);
}

fs.writeFileSync('server/tests/lab-02/tickets.api.test.ts', t, 'utf8');
