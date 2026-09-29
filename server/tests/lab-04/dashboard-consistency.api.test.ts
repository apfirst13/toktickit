import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/prisma";
import jwt from "jsonwebtoken";
import {
  REQUESTER_MY_OPEN_STATUSES,
  REQUESTER_IN_PROGRESS_STATUSES,
  REQUESTER_WAITING_STATUSES,
  STAFF_OPEN_STATUSES,
  STAFF_IN_PROGRESS_STATUSES,
  STAFF_WAITING_STATUSES,
} from "../../src/utils/ticket-query.util.js";

// Converts a const-array to comma-separated query string, e.g. ['OPEN','REOPENED'] -> 'OPEN,REOPENED'
const toStatusQuery = (arr: readonly string[]) => arr.join(',');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in tests");

describe("Lab 4 - Dashboard Consistency (Rule 13 Invariant Tests)", () => {
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
    staffToken = jwt.sign(
      { userId: staff.id, role: staff.role, email: staff.email, mustChangePassword: false },
      JWT_SECRET, { expiresIn: "1h" }
    );

    const reqUser = await prisma.user.upsert({
      where: { email: 'req.consist@test.com' },
      update: {},
      create: { email: 'req.consist@test.com', passwordHash: 'dummy', fullName: 'Req C', role: 'REQUESTER' }
    });
    reqId = reqUser.id;
    reqToken = jwt.sign(
      { userId: reqUser.id, role: reqUser.role, email: reqUser.email, mustChangePassword: false },
      JWT_SECRET, { expiresIn: "1h" }
    );

    const categoryId = (await prisma.category.findFirst())!.id;
    const relatedSystemId = (await prisma.relatedSystem.findFirst())!.id;
    const prefix = Date.now().toString().slice(-6);

    // Create a precise fixture covering every status we care about
    await prisma.ticket.create({ data: { ticketNumber: `DC1-${prefix}`, summary: "T-NEW",  requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "NEW",                   requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC2-${prefix}`, summary: "T-OPEN", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "OPEN",                  requestedPriority: "HIGH" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC3-${prefix}`, summary: "T-REOP", requesterUserId: reqId, assignedStaffId: staffId, categoryId, relatedSystemId, currentStatus: "REOPENED",              requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC4-${prefix}`, summary: "T-INP",  requesterUserId: reqId, assignedStaffId: null,    categoryId, relatedSystemId, currentStatus: "IN_PROGRESS",          requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC5-${prefix}`, summary: "T-WAIT", requesterUserId: reqId, assignedStaffId: null,    categoryId, relatedSystemId, currentStatus: "WAITING_FOR_REQUESTER", requestedPriority: "LOW" } });
    await prisma.ticket.create({ data: { ticketNumber: `DC6-${prefix}`, summary: "T-RESV", requesterUserId: reqId, assignedStaffId: null,    categoryId, relatedSystemId, currentStatus: "RESOLVED",             requestedPriority: "LOW" } });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterUserId: reqId } });
    await prisma.$disconnect();
  });

  // ── API-09: Staff Dashboard × Queue Invariant ─────────────────────────────
  it("API-09: Every staff dashboard metric must equal the matching queue endpoint (imported constants)", async () => {
    const dashRes = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", "Bearer " + staffToken);
    expect(dashRes.status).toBe(200);
    const metrics = dashRes.body.metrics;

    const queueTotal = async (query: string) => {
      const res = await request(app)
        .get(`/api/staff/queue?${query}`)
        .set("Authorization", "Bearer " + staffToken);
      expect(res.status, `Queue query failed: ${query} → ${JSON.stringify(res.body)}`).toBe(200);
      return res.body.pagination.total as number;
    };

    // Each assertion uses the same constant that the controller uses
    expect(metrics.new).toBe(await queueTotal("status=NEW"));
    // BR-METRIC-04: Staff Open = OPEN + REOPENED
    expect(metrics.open).toBe(await queueTotal(`status=${toStatusQuery(STAFF_OPEN_STATUSES)}`));
    // BR-METRIC-05: In Progress = IN_PROGRESS only
    expect(metrics.inProgress).toBe(await queueTotal(`status=${toStatusQuery(STAFF_IN_PROGRESS_STATUSES)}`));
    // BR-METRIC-06: Waiting = WAITING_FOR_REQUESTER only
    expect(metrics.waiting).toBe(await queueTotal(`status=${toStatusQuery(STAFF_WAITING_STATUSES)}`));
    expect(metrics.myAssigned).toBe(await queueTotal("assignedTo=me"));
    expect(metrics.urgent).toBe(await queueTotal("isUrgent=true"));
  });

  // ── API-10: Requester Dashboard × List Invariant ──────────────────────────
  it("API-10: Every requester dashboard metric must equal the matching list endpoint (imported constants)", async () => {
    const dashRes = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", "Bearer " + reqToken);
    expect(dashRes.status).toBe(200);
    const metrics = dashRes.body.metrics;

    const listTotal = async (query: string) => {
      const res = await request(app)
        .get(`/api/tickets?${query}`)
        .set("Authorization", "Bearer " + reqToken);
      expect(res.status, `List query failed: ${query} → ${JSON.stringify(res.body)}`).toBe(200);
      return res.body.pagination.total as number;
    };

    // BR-METRIC-01: My Open = NEW + OPEN + REOPENED
    expect(metrics.myOpen).toBe(await listTotal(`status=${toStatusQuery(REQUESTER_MY_OPEN_STATUSES)}`));
    // BR-METRIC-02: In Progress = IN_PROGRESS only
    expect(metrics.inProgress).toBe(await listTotal(`status=${toStatusQuery(REQUESTER_IN_PROGRESS_STATUSES)}`));
    // BR-METRIC-03: Waiting = WAITING_FOR_REQUESTER only
    expect(metrics.waiting).toBe(await listTotal(`status=${toStatusQuery(REQUESTER_WAITING_STATUSES)}`));
    expect(metrics.resolved).toBe(await listTotal("status=RESOLVED"));
    expect(metrics.closed).toBe(await listTotal("status=CLOSED"));
  });

  // ── API-11: Invalid status → 400 ──────────────────────────────────────────
  it("API-11: Should return 400 for invalid status query parameter", async () => {
    const res = await request(app)
      .get("/api/tickets?status=INVALID_STATUS")
      .set("Authorization", "Bearer " + reqToken);
    expect(res.status).toBe(400);
  });
});
