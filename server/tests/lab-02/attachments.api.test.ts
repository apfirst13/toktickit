import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";

const TEST_EMAIL = "attach_test_user@example.com";
const OTHER_EMAIL = "other_user@example.com";
const TEST_CATEGORY = "__AttachTestCategory__";
const TEST_SYSTEM = "__AttachTestSystem__";

let requesterId: number;
let otherRequesterId: number;
let ticketId: number;

describe("Attachment Endpoints", () => {
  beforeAll(async () => {
    // Clean up
    await prisma.attachment.deleteMany({
      where: { ticket: { requesterUser: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } } },
    });
    await prisma.ticket.deleteMany({
      where: { requesterUser: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } },
    });
    await prisma.requesterUser.deleteMany({ where: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } });
    await prisma.category.deleteMany({ where: { name: TEST_CATEGORY } });
    await prisma.relatedSystem.deleteMany({ where: { name: TEST_SYSTEM } });

    // Seed
    const [requester, other, category, system] = await Promise.all([
      prisma.requesterUser.create({ data: { name: "Attach User", email: TEST_EMAIL } }),
      prisma.requesterUser.create({ data: { name: "Other User", email: OTHER_EMAIL } }),
      prisma.category.create({ data: { name: TEST_CATEGORY } }),
      prisma.relatedSystem.create({ data: { name: TEST_SYSTEM } }),
    ]);

    requesterId = requester.id;
    otherRequesterId = other.id;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIK-ATCH-${Date.now()}`,
        summary: "Attachment test",
        description: "Need to upload some screenshots",
        requestedPriority: "Medium",
        currentStatus: "New",
        requesterUserId: requesterId,
        categoryId: category.id,
        relatedSystemId: system.id,
      },
    });

    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({
      where: { ticket: { requesterUser: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } } },
    });
    await prisma.ticket.deleteMany({
      where: { requesterUser: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } },
    });
    await prisma.requesterUser.deleteMany({ where: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } } });
    await prisma.category.deleteMany({ where: { name: TEST_CATEGORY } });
    await prisma.relatedSystem.deleteMany({ where: { name: TEST_SYSTEM } });
    await prisma.$disconnect();
  });

  it("should add up to 5 attachments", async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).post(`/api/tickets/${ticketId}/attachments`).send({
        requesterId,
        fileName: `file${i}.jpg`,
        fileUrl: `http://example.com/file${i}.jpg`,
        fileType: "image/jpeg",
        fileSize: 1024 * i,
      });
      expect(res.status).toBe(201);
    }
  });

  it("should block adding a 6th attachment", async () => {
    const res = await request(app).post(`/api/tickets/${ticketId}/attachments`).send({
      requesterId,
      fileName: "file6.jpg",
      fileUrl: "http://example.com/file6.jpg",
      fileType: "image/jpeg",
      fileSize: 1024,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Maximum of 5 active attachments");
  });

  it("should soft remove an attachment securely", async () => {
    // Get attachments to find one ID
    const ticketRes = await request(app).get(`/api/tickets/${ticketId}?requesterId=${requesterId}`);
    const attachmentId = ticketRes.body.attachments[0].id;

    // Try removing as other user (should fail 403)
    const failRes = await request(app).delete(`/api/tickets/${ticketId}/attachments/${attachmentId}?requesterId=${otherRequesterId}`);
    expect(failRes.status).toBe(403);

    // Remove as actual owner
    const res = await request(app).delete(`/api/tickets/${ticketId}/attachments/${attachmentId}?requesterId=${requesterId}`);
    expect(res.status).toBe(200);

    // Verify it's soft-removed in the DB
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    expect(attachment?.isRemoved).toBe(true);
    expect(attachment?.removedAt).not.toBeNull();

    // The ticket GET should now return 4 active attachments
    const ticketRes2 = await request(app).get(`/api/tickets/${ticketId}?requesterId=${requesterId}`);
    expect(ticketRes2.body.attachments).toHaveLength(4);
  });
});
