import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in tests");

describe("Lab 4 - Staff Dashboard API", () => {
  let staffToken: string;
  let adminToken: string;
  let reqToken: string;
  let staffId: number;
  let reqId: number;

  beforeAll(async () => {
    // Upsert users
    const staff = await prisma.user.upsert({
      where: { email: 'staff.dash@test.com' },
      update: {},
      create: { email: 'staff.dash@test.com', passwordHash: 'dummy', fullName: 'Staff Dash', role: 'IT_STAFF' }
    });
    staffId = staff.id;

    const admin = await prisma.user.upsert({
      where: { email: 'admin.dash@test.com' },
      update: {},
      create: { email: 'admin.dash@test.com', passwordHash: 'dummy', fullName: 'Admin Dash', role: 'ADMINISTRATOR' }
    });

    const req = await prisma.user.upsert({
      where: { email: 'req.dash2@test.com' },
      update: {},
      create: { email: 'req.dash2@test.com', passwordHash: 'dummy', fullName: 'Req Dash 2', role: 'REQUESTER' }
    });
    reqId = req.id;

    staffToken = jwt.sign({ userId: staff.id, role: staff.role, email: staff.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });
    adminToken = jwt.sign({ userId: admin.id, role: admin.role, email: admin.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });
    reqToken = jwt.sign({ userId: req.id, role: req.role, email: req.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });

    const categoryId = (await prisma.category.findFirst())!.id;
    const relatedSystemId = (await prisma.relatedSystem.findFirst())!.id;

    const prefix = Date.now().toString().slice(-6);

    // Create tickets to populate dashboard
    await prisma.ticket.create({ data: { ticketNumber: `SD1-${prefix}`, summary: "SD New", requesterUserId: reqId, categoryId, relatedSystemId, currentStatus: "NEW", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `SD2-${prefix}`, summary: "SD Open", requesterUserId: reqId, categoryId, relatedSystemId, currentStatus: "OPEN", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `SD3-${prefix}`, summary: "SD InProg", requesterUserId: reqId, categoryId, relatedSystemId, currentStatus: "IN_PROGRESS", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `SD4-${prefix}`, summary: "SD Wait", requesterUserId: reqId, categoryId, relatedSystemId, currentStatus: "WAITING_FOR_REQUESTER", requestedPriority: "LOW" } });
    
    // Assigned to this staff
    await prisma.ticket.create({ data: { ticketNumber: `SD5-${prefix}`, summary: "SD Assigned", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "IN_PROGRESS", requestedPriority: "LOW" } });
    
    // Urgent
    await prisma.ticket.create({ data: { ticketNumber: `SD6-${prefix}`, summary: "SD Urgent", requesterUserId: reqId, categoryId, relatedSystemId, currentStatus: "NEW", requestedPriority: "URGENT" } });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterUserId: reqId } });
    await prisma.$disconnect();
  });

  it("API-09: IT Staff can view staff dashboard metrics", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", "Bearer " + staffToken);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.new).toBeGreaterThanOrEqual(2); // SD1 + SD6
    expect(res.body.metrics.open).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.inProgress).toBeGreaterThanOrEqual(2);
    expect(res.body.metrics.waiting).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.myAssigned).toBeGreaterThanOrEqual(1);
    expect(res.body.metrics.urgent).toBeGreaterThanOrEqual(1);
    
    expect(res.body.recentlyUpdated).toBeInstanceOf(Array);
    
    // Should NOT include totalUsers for IT_STAFF
    expect(res.body.metrics.totalUsers).toBeUndefined();
  });

  it("API-09: Admin can view staff dashboard and sees totalUsers", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", "Bearer " + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalUsers).toBeGreaterThanOrEqual(1); // At least the 3 users created above
  });

  it("API-09: Requester cannot access staff dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", "Bearer " + reqToken);

    expect(res.status).toBe(403);
  });
});
