import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in tests");

describe("Lab 4 - Dashboards API", () => {
  let requester1Token: string;
  let requester2Token: string;
  let staffToken: string;
  let req1Id: number;
  let req2Id: number;

  beforeAll(async () => {
    // Upsert users
    const req1 = await prisma.user.upsert({
      where: { email: 'req1.dash@test.com' },
      update: {},
      create: { email: 'req1.dash@test.com', passwordHash: 'dummy', fullName: 'Req Dash 1', role: 'REQUESTER' }
    });
    req1Id = req1.id;

    const req2 = await prisma.user.upsert({
      where: { email: 'req2.dash@test.com' },
      update: {},
      create: { email: 'req2.dash@test.com', passwordHash: 'dummy', fullName: 'Req Dash 2', role: 'REQUESTER' }
    });
    req2Id = req2.id;

    const staff = await prisma.user.upsert({
      where: { email: 'staff.dash@test.com' },
      update: {},
      create: { email: 'staff.dash@test.com', passwordHash: 'dummy', fullName: 'Staff Dash', role: 'IT_STAFF' }
    });

    requester1Token = jwt.sign({ userId: req1.id, role: req1.role, email: req1.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });
    requester2Token = jwt.sign({ userId: req2.id, role: req2.role, email: req2.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });
    staffToken = jwt.sign({ userId: staff.id, role: staff.role, email: staff.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });

    const categoryId = (await prisma.category.findFirst())!.id;
    const relatedSystemId = (await prisma.relatedSystem.findFirst())!.id;

    const prefix = Date.now().toString().slice(-6);

    // Create tickets for Req 1
    await prisma.ticket.create({ data: { ticketNumber: `RD1-${prefix}`, summary: "Req1 Open", requesterUserId: req1.id, categoryId, relatedSystemId, currentStatus: "OPEN", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `RD2-${prefix}`, summary: "Req1 InProg", requesterUserId: req1.id, categoryId, relatedSystemId, currentStatus: "IN_PROGRESS", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `RD3-${prefix}`, summary: "Req1 Resolved", requesterUserId: req1.id, categoryId, relatedSystemId, currentStatus: "RESOLVED", requestedPriority: "LOW" } });

    // Create tickets for Req 2 (to verify isolation)
    await prisma.ticket.create({ data: { ticketNumber: `RD4-${prefix}`, summary: "Req2 Open", requesterUserId: req2.id, categoryId, relatedSystemId, currentStatus: "OPEN", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `RD5-${prefix}`, summary: "Req2 Open 2", requesterUserId: req2.id, categoryId, relatedSystemId, currentStatus: "OPEN", requestedPriority: "LOW" } });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterUserId: { in: [req1Id, req2Id] } } });
    await prisma.$disconnect();
  });

  it("API-08: should return requester dashboard metrics scoped strictly to req.user.id", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", "Bearer " + requester1Token);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    // Requesters should only see their own tickets
    expect(res.body.metrics.myOpen).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.inProgress).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.resolved).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.closed).toBeGreaterThanOrEqual(0);
    
    // Check recently updated list
    expect(res.body.recentlyUpdated).toBeInstanceOf(Array);
    expect(res.body.recentlyUpdated.length).toBeGreaterThanOrEqual(3);
    expect(res.body.recentlyUpdated[0].requesterUserId).toBe(req1Id); // Strict ownership
  });

  it("API-08: another requester should see different counts based on their own tickets", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", "Bearer " + requester2Token);

    expect(res.status).toBe(200);
    expect(res.body.metrics.myOpen).toBeGreaterThanOrEqual(2); // Req 2 has 2 open
    expect(res.body.metrics.inProgress).toBe(0);
  });

  it("API-08: IT Staff cannot access requester dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", "Bearer " + staffToken);

    expect(res.status).toBe(403);
  });
});
