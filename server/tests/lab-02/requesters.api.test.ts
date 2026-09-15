import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";

describe("GET /api/requesters", () => {
  beforeAll(async () => {
    // Clean slate - tickets first (FK constraint), then requesters
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed deterministic test data: 2 active, 1 inactive
    await prisma.user.createMany({
      data: [
        { fullName: "Alice", email: "alice@example.com", isActive: true, passwordHash: "dummy", role: "REQUESTER" },
        { fullName: "Bob", email: "bob@example.com", isActive: true, passwordHash: "dummy", role: "REQUESTER" },
        { fullName: "Eve", email: "eve@example.com", isActive: false, passwordHash: "dummy", role: "REQUESTER" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should return HTTP 200 and a list of active requesters", async () => {
    const res = await request(app).get("/api/requesters");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Should return only the 2 active users, not Eve (inactive)
    expect(res.body).toHaveLength(2);

    // All returned requesters must have isActive: true
    res.body.forEach((requester: { isActive: boolean; id: number; fullName: string; email: string }) => {
      expect(requester.isActive).toBe(true);
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("fullName");
      expect(requester).toHaveProperty("email");
    });

    // Names should match seeded active users
    const names = res.body.map((r: { fullName: string }) => r.fullName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).not.toContain("Eve");
  });
});
