import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in tests");

describe("Lab 4 - Dashboard Consistency (Rule 13)", () => {
  let staffToken: string;
  let reqToken: string;
  let staffId: number;
  let reqId: number;
  
  beforeAll(async () => {
    const staff = await prisma.user.upsert({
      where: { email: 'staff.consist@test.com' },
      update: {},
      create: { email: 'staff.consist@test.com', passwordHash: 'dummy', fullName: 'Staff C', role: 'IT_STAFF' }
    });
    staffId = staff.id;
    staffToken = jwt.sign({ userId: staff.id, role: staff.role, email: staff.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });

    const reqUser = await prisma.user.upsert({
      where: { email: 'req.consist@test.com' },
      update: {},
      create: { email: 'req.consist@test.com', passwordHash: 'dummy', fullName: 'Req C', role: 'REQUESTER' }
    });
    reqId = reqUser.id;
    reqToken = jwt.sign({ userId: reqUser.id, role: reqUser.role, email: reqUser.email, mustChangePassword: false }, JWT_SECRET, { expiresIn: "1h" });

    const categoryId = (await prisma.category.findFirst())!.id;
    const relatedSystemId = (await prisma.relatedSystem.findFirst())!.id;
    const prefix = Date.now().toString().slice(-6);

    // Create a precise set of tickets
    await prisma.ticket.create({ data: { ticketNumber: `DC1-${prefix}`, summary: "T1", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "NEW", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC2-${prefix}`, summary: "T2", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "OPEN", requestedPriority: "HIGH" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC3-${prefix}`, summary: "T3", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "REOPENED", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC4-${prefix}`, summary: "T4", requesterUserId: reqId, assignedStaffId: null, categoryId, relatedSystemId, currentStatus: "IN_PROGRESS", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC5-${prefix}`, summary: "T5", requesterUserId: reqId, assignedStaffId: null, categoryId, relatedSystemId, currentStatus: "WAITING_FOR_REQUESTER", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC6-${prefix}`, summary: "T6", requesterUserId: reqId, assignedStaffId: null, categoryId, relatedSystemId, currentStatus: "RESOLVED", requestedPriority: "LOW" } });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterUserId: reqId } });
    await prisma.$disconnect();
  });

  it("API-09: Dashboard counts must perfectly match List API with corresponding filters (Invariant Test)", async () => {
    // 1. Get Dashboard
    const dashRes = await request(app).get("/api/dashboard/staff").set("Authorization", "Bearer " + staffToken);
    expect(dashRes.status).toBe(200);
    const metrics = dashRes.body.metrics;

    // 2. Cross-check each metric card by fetching the queue endpoint directly
    const checkQueue = async (query: string) => {
      const res = await request(app).get(`/api/staff/queue?${query}`).set("Authorization", "Bearer " + staffToken);
      if (res.status !== 200) console.log("ERROR QUEUE:", res.status, res.text);
      return res.body.pagination.total;
    };

    const qNew = await checkQueue("status=NEW");
    expect(metrics.new).toBe(qNew);

    const qOpen = await checkQueue("status=OPEN,REOPENED");
    expect(metrics.open).toBe(qOpen);
    
    const qInProgress = await checkQueue("status=IN_PROGRESS");
    expect(metrics.inProgress).toBe(qInProgress);

    const qWaiting = await checkQueue("status=WAITING_FOR_REQUESTER");
    expect(metrics.waiting).toBe(qWaiting);

    const qMyAssigned = await checkQueue("assignedTo=me");
    expect(metrics.myAssigned).toBe(qMyAssigned);

    const qUrgent = await checkQueue("isUrgent=true");
    expect(metrics.urgent).toBe(qUrgent);
  });

  it("API-10: Requester dashboard counts must exactly match Requester list API (Invariant Test)", async () => {
    const dashRes = await request(app).get("/api/dashboard/requester").set("Authorization", "Bearer " + reqToken);
    expect(dashRes.status).toBe(200);
    const metrics = dashRes.body.metrics;

    const checkList = async (query: string) => {
      const res = await request(app).get(`/api/tickets?${query}`).set("Authorization", "Bearer " + reqToken);
      if (res.status !== 200) console.log("ERROR LIST:", res.status, res.text);
      return res.body.pagination.total;
    };

    expect(metrics.myOpen).toBe(await checkList("status=OPEN,REOPENED"));
    expect(metrics.inProgress).toBe(await checkList("status=IN_PROGRESS"));
    expect(metrics.waiting).toBe(await checkList("status=WAITING_FOR_REQUESTER"));
    expect(metrics.resolved).toBe(await checkList("status=RESOLVED"));
    expect(metrics.closed).toBe(await checkList("status=CLOSED"));
  });

  it("API-11: Should return 400 for invalid status filter", async () => {
    const res = await request(app).get("/api/tickets?status=INVALID_STATUS").set("Authorization", "Bearer " + reqToken);
    expect(res.status).toBe(400);
  });
});
