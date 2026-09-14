import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

// Use unique identifiers to isolate test data
const TEST_EMAIL = "tickets_test_user@example.com";
const TEST_CATEGORY = "__TicketsTestCategory__";
const TEST_SYSTEM = "__TicketsTestSystem__";

let requesterId: number;
let categoryId: number;
let systemId: number;
let authToken: string;
let authToken2: string;

describe("POST /api/tickets", () => {
  beforeAll(async () => {
    // Clean up any leftover test data first
    await prisma.ticket.deleteMany({
      where: { requesterUser: { email: TEST_EMAIL } },
    });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.user.deleteMany({ where: { email: '2_' + TEST_EMAIL } });
    await prisma.category.deleteMany({ where: { name: TEST_CATEGORY } });
    await prisma.relatedSystem.deleteMany({ where: { name: TEST_SYSTEM } });

    // Create isolated test data
    const requester = await prisma.user.create({
      data: { fullName: "Tickets Test User", passwordHash: "dummy", role: "REQUESTER", email: TEST_EMAIL, isActive: true },
    });
    requesterId = requester.id;
    authToken = jwt.sign({ userId: requesterId }, process.env.JWT_SECRET || 'test-secret');

    const requester2 = await prisma.user.create({
      data: { fullName: "Tickets Test User 2", email: "2_" + TEST_EMAIL, passwordHash: "dummy", isActive: true, role: "REQUESTER" }
    });
    authToken2 = jwt.sign({ userId: requester2.id }, process.env.JWT_SECRET || 'test-secret');


    const category = await prisma.category.create({
      data: { name: TEST_CATEGORY },
    });
    categoryId = category.id;

    const system = await prisma.relatedSystem.create({
      data: { name: TEST_SYSTEM },
    });
    systemId = system.id;
  });

  afterAll(async () => {
    // Clean up in FK order
    await prisma.ticket.deleteMany({ where: { requesterUserId: requesterId } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.user.deleteMany({ where: { email: '2_' + TEST_EMAIL } });
    await prisma.category.deleteMany({ where: { name: TEST_CATEGORY } });
    await prisma.relatedSystem.deleteMany({ where: { name: TEST_SYSTEM } });
    await prisma.$disconnect();
  });

  it("should create a ticket and return 201 with a ticket number", async () => {
    const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
      summary: "My printer is not working at all",
      description: "The printer in room 301 has not been working since Monday morning. I need it urgently.",
      categoryId,
      systemId,
      requestedPriority: "High",
      requesterId,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TIK-\d{9,10}$/);
    expect(res.body.currentStatus).toBe("NEW");
    expect(res.body.summary).toBe("My printer is not working at all");
  });

  it("should return tickets only for the requesting user (isolation)", async () => {
    // Another user requesting tickets
    const res = await request(app).get(`/api/tickets`).set("Authorization", "Bearer " + authToken2);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);

    // Actual user requesting tickets
    const res2 = await request(app).get(`/api/tickets`).set("Authorization", "Bearer " + authToken);
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBeGreaterThan(0);
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("should return 400 when summary exceeds 200 characters", async () => {
    const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
      summary: "A".repeat(201),
      description: "A valid description that is long enough to pass the minimum check here.",
      categoryId,
      systemId,
      requestedPriority: "Low",
      requesterId,
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toContain("summary");
  });

  it("should return 400 when description is shorter than 20 characters", async () => {
    const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
      summary: "Valid summary here",
      description: "Too short",
      categoryId,
      systemId,
      requestedPriority: "Medium",
      requesterId,
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toContain("description");
  });

  it("should return 400 when requestedPriority is invalid", async () => {
    const res = await request(app).post("/api/tickets").set("Authorization", "Bearer " + authToken).send({
      summary: "Valid summary here",
      description: "This is a valid description that is definitely long enough.",
      categoryId,
      systemId,
      requestedPriority: "Critical",
      requesterId,
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toContain("requestedPriority");
  });
});
