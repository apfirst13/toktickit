import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { app } from "../../src/app";

// Note: since this interacts with the DB, we might want to either mock Prisma
// or rely on the test database. For now we will rely on integration testing.
// A full test would clear DB, insert a true and false active requester, and assert.

describe("GET /api/requesters", () => {
  it("should return HTTP 200 and a list of active requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Ensure all returned requesters have isActive true
    res.body.forEach((requester: any) => {
      expect(requester.isActive).toBe(true);
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
    });
  });
});

