import { describe, it, expect, beforeAll, afterAll } from "vitest";

import request from "supertest";

import { app } from "../../src/app.js";

import { prisma } from "../../src/prisma.js";

import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-lab3";


let staffToken: string;

let adminToken: string;

let requesterToken: string;

let staffId: number;

let adminId: number;

let ticketId: number;


describe("IT Staff Ticket Detail API", () => {
  beforeAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ["staff_det@test.com", "admin_det@test.com", "req_det@test.com", "inactive_staff@test.com"] } }
    });

    const staff = await prisma.user.create({
      data: { fullName: "Staff Det", email: "staff_det@test.com", passwordHash: "dummy", role: "IT_STAFF" }
    });
    staffId = staff.id;

    const admin = await prisma.user.create({
      data: { fullName: "Admin Det", email: "admin_det@test.com", passwordHash: "dummy", role: "ADMINISTRATOR" }
    });
    adminId = admin.id;

    const reqUser = await prisma.user.create({
      data: { fullName: "Req Det", email: "req_det@test.com", passwordHash: "dummy", role: "REQUESTER" }
    });

    const inactiveStaff = await prisma.user.create({
      data: { fullName: "Inactive Staff", email: "inactive_staff@test.com", passwordHash: "dummy", role: "IT_STAFF", isActive: false }
    });

    staffToken = jwt.sign({ userId: staff.id, role: staff.role }, JWT_SECRET);
    adminToken = jwt.sign({ userId: admin.id, role: admin.role }, JWT_SECRET);
    requesterToken = jwt.sign({ userId: reqUser.id, role: reqUser.role }, JWT_SECRET);

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    const t = await prisma.ticket.create({
      data: { ticketNumber: "T-DET-1", summary: "T1", description: "D1", requestedPriority: "LOW", currentStatus: "NEW", requesterUserId: reqUser.id, categoryId: cat!.id, relatedSystemId: sys!.id, itPriority: "LOW" }
    });
    ticketId = t.id;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ["staff_det@test.com", "admin_det@test.com", "req_det@test.com", "inactive_staff@test.com"] } }
    });
  });

  it("should get active staff list for dropdowns", async () => {
    const res = await request(app).get("/api/staff/users").set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    const emails = res.body.map((u: any) => u.fullName);
    expect(emails).contain("Staff Det");
    expect(emails).contain("Admin Det");
    expect(emails).not.contain("Inactive Staff");
    expect(emails).not.contain("Req Det");
  });

  it("should allow staff to fetch ticket bypassing ownership check", async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketId);
  });

  it("should reject assignment to inactive staff or non-staff (AC-14)", async () => {
    const inactiveUser = await prisma.user.findFirst({ where: { email: "inactive_staff@test.com" } });
    const reqUser = await prisma.user.findFirst({ where: { email: "req_det@test.com" } });

    const res1 = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ assignedStaffId: inactiveUser!.id });
    expect(res1.status).toBe(400);

    const res2 = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ assignedStaffId: reqUser!.id });
    expect(res2.status).toBe(400);
  });

  it("should allow assignment to active IT_STAFF (AC-11)", async () => {
    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ assignedStaffId: staffId });
    expect(res.status).toBe(200);
    expect(res.body.assignedStaffId).toBe(staffId);
  });

  it("should allow staff to modify IT priority (AC-15)", async () => {
    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe("HIGH");
  });

  it("should reject modification of requestedPriority (BR-11)", async () => {
    const originalTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    const originalReqPriority = originalTicket!.requestedPriority;

    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ requestedPriority: "URGENT" });
    
    // The backend should either reject it (400) or ignore it (200 but value unchanged).
    // Let's verify the value is unchanged in the DB.
    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    expect(updatedTicket!.requestedPriority).toBe(originalReqPriority);
  });

  it("should reject invalid status transitions with 400 (API-06)", async () => {
    // Current status is NEW. Transition to RESOLVED is invalid.
    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(400);
    expect(res.body.error).contain("Invalid status transition");
  });

  it("should allow staff to perform valid status transitions (API-05)", async () => {
    // NEW -> OPEN
    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + staffToken)
      .send({ status: "OPEN" });
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("OPEN");
  });

  it("should return 403 when requester attempts to formally resolve a ticket (API-07)", async () => {
    const res = await request(app).patch(`/api/staff/tickets/${ticketId}`).set("Authorization", "Bearer " + requesterToken)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(403);
  });
});
