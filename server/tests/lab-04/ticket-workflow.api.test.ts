import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in tests");

describe("Lab 4 - Ticket Workflow API", () => {
  let staffToken: string;
  let requesterToken: string;
  let testTicketId1: number;
  let testTicketId2: number;

  beforeAll(async () => {
    const staff = await prisma.user.upsert({
      where: { email: 'staff.test.workflow@example.com' },
      update: {},
      create: {
        email: 'staff.test.workflow@example.com',
        passwordHash: 'dummy',
        fullName: 'Workflow Staff',
        role: 'IT_STAFF'
      }
    });
    const reqUser = await prisma.user.upsert({
      where: { email: 'req.test.workflow@example.com' },
      update: {},
      create: {
        email: 'req.test.workflow@example.com',
        passwordHash: 'dummy',
        fullName: 'Workflow Requester',
        role: 'REQUESTER'
      }
    });
    
    staffToken = jwt.sign({ userId: staff.id, role: staff.role, email: staff.email, mustChangePassword: staff.mustChangePassword }, JWT_SECRET, { expiresIn: "1h" });
    requesterToken = jwt.sign({ userId: reqUser.id, role: reqUser.role, email: reqUser.email, mustChangePassword: reqUser.mustChangePassword }, JWT_SECRET, { expiresIn: "1h" });

    const ticketPrefix = Date.now().toString().slice(-6);
    
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `WF1-${ticketPrefix}`,
        summary: "Needs resolution with action",
        description: "Test 1",
        requesterUserId: reqUser.id,
        categoryId: (await prisma.category.findFirst())!.id,
        relatedSystemId: (await prisma.relatedSystem.findFirst())!.id,
        currentStatus: "IN_PROGRESS",
        requestedPriority: "LOW"
      }
    });
    testTicketId1 = t1.id;

    await prisma.actionTaken.create({
      data: {
        ticketId: t1.id,
        performedById: staff.id,
        description: "Fixed it",
        result: "Resolved",
        actionDateTime: new Date()
      }
    });

    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `WF2-${ticketPrefix}`,
        summary: "Needs resolution without action",
        description: "Test 2",
        requesterUserId: reqUser.id,
        categoryId: (await prisma.category.findFirst())!.id,
        relatedSystemId: (await prisma.relatedSystem.findFirst())!.id,
        currentStatus: "IN_PROGRESS",
        requestedPriority: "LOW"
      }
    });
    testTicketId2 = t2.id;
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({ where: { ticketId: { in: [testTicketId1, testTicketId2] } } });
    await prisma.ticket.deleteMany({ where: { id: { in: [testTicketId1, testTicketId2] } } });
    await prisma.$disconnect();
  });

  it("API-06: should allow transitioning to RESOLVED if it has at least one Action Taken", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId1}`)
      .set("Authorization", "Bearer " + staffToken)
      .send({ status: "RESOLVED" });
    
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("RESOLVED");
  });

  it("API-07: should reject transitioning to RESOLVED if it has no Action Taken", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId2}`)
      .set("Authorization", "Bearer " + staffToken)
      .send({ status: "RESOLVED" });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("At least one Action Taken is required");
  });

  it("should mark ticket as appearsResolved by requester but leave status intact (Advisory)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId2}/appears-resolved`)
      .set("Authorization", "Bearer " + requesterToken);
    
    expect(res.status).toBe(200);
    expect(res.body.appearsResolved).toBe(true);
    expect(res.body.currentStatus).toBe("IN_PROGRESS");
  });
});
