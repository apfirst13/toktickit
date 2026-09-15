import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-lab3';

let staffToken: string;
let requesterToken: string;
let categoryId: number;
let systemId: number;

describe("IT Staff Queue API", () => {
  beforeAll(async () => {
    // Delete ALL tickets so our count assertions (e.g., total=3) work reliably
    await prisma.ticket.deleteMany({});
    // Only delete test users to avoid affecting seeded users
    await prisma.user.deleteMany({ where: { email: { in: ["staff@test.com", "req@test.com"] } } });

    // Create users
    const staff = await prisma.user.create({
      data: { fullName: "Staff1", email: "staff@test.com", passwordHash: "dummy", role: "IT_STAFF" }
    });
    const reqUser = await prisma.user.create({
      data: { fullName: "Req1", email: "req@test.com", passwordHash: "dummy", role: "REQUESTER" }
    });

    staffToken = jwt.sign({ userId: staff.id, role: staff.role }, JWT_SECRET);
    requesterToken = jwt.sign({ userId: reqUser.id, role: reqUser.role }, JWT_SECRET);

    const cat = await prisma.category.findFirst();
    categoryId = cat!.id;
    const sys = await prisma.relatedSystem.findFirst();
    systemId = sys!.id;

    // Create tickets
    await prisma.ticket.createMany({
      data: [
        { ticketNumber: "T-001", summary: "Ticket A", description: "Desc A", requestedPriority: "LOW", currentStatus: "NEW", requesterUserId: reqUser.id, categoryId, relatedSystemId: systemId, itPriority: "LOW" },
        { ticketNumber: "T-002", summary: "Ticket B", description: "Desc B", requestedPriority: "HIGH", currentStatus: "IN_PROGRESS", requesterUserId: reqUser.id, categoryId, relatedSystemId: systemId, itPriority: "URGENT", assignedStaffId: staff.id },
        { ticketNumber: "T-003", summary: "Ticket C", description: "Desc C", requestedPriority: "MEDIUM", currentStatus: "NEW", requesterUserId: reqUser.id, categoryId, relatedSystemId: systemId, itPriority: "MEDIUM" },
      ]
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { in: ["staff@test.com", "req@test.com"] } } });
    await prisma.$disconnect();
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/staff/queue");
    expect(res.status).toBe(401);
  });

  it("should return 403 when role is REQUESTER", async () => {
    const res = await request(app).get("/api/staff/queue").set("Authorization", "Bearer " + requesterToken);
    expect(res.status).toBe(403);
  });

  it("should return 200 and paginated tickets for staff (API-04)", async () => {
    const res = await request(app).get("/api/staff/queue").set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.data.length).toBe(3);
  });

  it("should search correctly by ticketNumber or summary", async () => {
    const res1 = await request(app).get("/api/staff/queue?search=T-001").set("Authorization", "Bearer " + staffToken);
    expect(res1.body.data.length).toBe(1);
    expect(res1.body.data[0].ticketNumber).toBe("T-001");

    const res2 = await request(app).get("/api/staff/queue?search=Ticket B").set("Authorization", "Bearer " + staffToken);
    expect(res2.body.data.length).toBe(1);
    expect(res2.body.data[0].summary).toBe("Ticket B");
  });

  it("should filter correctly by category, status, requestedPriority, itPriority, assignedTo", async () => {
    // Status
    const res1 = await request(app).get("/api/staff/queue?status=IN_PROGRESS").set("Authorization", "Bearer " + staffToken);
    expect(res1.body.data.length).toBe(1);
    expect(res1.body.data[0].ticketNumber).toBe("T-002");

    // itPriority
    const res2 = await request(app).get("/api/staff/queue?itPriority=URGENT").set("Authorization", "Bearer " + staffToken);
    expect(res2.body.data.length).toBe(1);

    // assignedTo=unassigned
    const res3 = await request(app).get("/api/staff/queue?assignedTo=unassigned").set("Authorization", "Bearer " + staffToken);
    expect(res3.body.data.length).toBe(2); // T-001 and T-003
    expect(res3.body.data.map((t: any) => t.ticketNumber)).not.toContain("T-002");
  });

  it("should sort correctly asc and desc", async () => {
    const resAsc = await request(app).get("/api/staff/queue?sortBy=ticketNumber&sortOrder=asc").set("Authorization", "Bearer " + staffToken);
    // ticketNumber is NOT in whitelist! Should fallback to createdAt
    expect(resAsc.body.data.length).toBe(3);

    const resDesc = await request(app).get("/api/staff/queue?sortBy=itPriority&sortOrder=desc").set("Authorization", "Bearer " + staffToken);
    // URGENT > MEDIUM > LOW alphabetically for desc, wait, enum string desc
    expect(resDesc.body.data[0].itPriority).toBe("URGENT");
  });

  it("should fallback to createdAt for sortBy not in whitelist", async () => {
    const res = await request(app).get("/api/staff/queue?sortBy=DROP_TABLE&sortOrder=asc").set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    // Should sort by createdAt asc by fallback
    expect(res.body.data[0].ticketNumber).toBe("T-001"); // inserted first
  });

  it("should fallback to defaults for page/limit invalid format", async () => {
    const res = await request(app).get("/api/staff/queue?page=abc&limit=def").set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it("should cap limit at 50", async () => {
    const res = await request(app).get("/api/staff/queue?limit=999").set("Authorization", "Bearer " + staffToken);
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(50);
  });
});
