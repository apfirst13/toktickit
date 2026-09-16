import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import { app } from "../../src/app.js";
import { prisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

// ── Test fixtures ────────────────────────────────────────────────────────────
const OWNER_EMAIL = "att_owner@test.example";
const OTHER_EMAIL = "att_other@test.example";
const CAT_NAME = "__AttachCat__";
const SYS_NAME = "__AttachSys__";

let ownerId: number;
let otherId: number;
let authToken: string;
let otherToken: string;
let ticketId: number;
let otherTicketId: number;

// Tiny helpers to create real temp files Supertest can attach
function makeTempFile(name: string, sizeBytes: number, ext = ".jpg") {
  const file = path.join("uploads", `_test_${name}${ext}`);
  fs.writeFileSync(file, Buffer.alloc(sizeBytes, 0x00));
  return file;
}

describe("Attachment API – Issue 6", () => {
  beforeAll(async () => {
    // Cleanup leftovers from previous runs
    await prisma.attachment.deleteMany({
      where: { ticket: { requesterUser: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } } },
    });
    await prisma.ticket.deleteMany({
      where: { requesterUser: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } });
    await prisma.category.deleteMany({ where: { name: CAT_NAME } });
    await prisma.relatedSystem.deleteMany({ where: { name: SYS_NAME } });

    const [owner, other, cat, sys] = await Promise.all([
      prisma.user.create({ data: { fullName: "Att Owner", passwordHash: "dummy", role: "REQUESTER", email: OWNER_EMAIL } }),
      prisma.user.create({ data: { fullName: "Att Other", passwordHash: "dummy", role: "REQUESTER", email: OTHER_EMAIL } }),
      prisma.category.create({ data: { name: CAT_NAME } }),
      prisma.relatedSystem.create({ data: { name: SYS_NAME } }),
    ]);

    ownerId = owner.id;
    otherId = other.id;
    authToken = jwt.sign({ userId: ownerId, role: "REQUESTER" }, process.env.JWT_SECRET || 'test-secret-key-for-lab3');
    otherToken = jwt.sign({ userId: otherId, role: "REQUESTER" }, process.env.JWT_SECRET || 'test-secret-key-for-lab3');

    const makeTicket = (uid: number) =>
      prisma.ticket.create({
        data: {
          ticketNumber: `TIK-ATT-${Date.now()}-${uid}`,
          summary: "Attachment test ticket",
          description: "Testing attachment endpoints for Issue 6",
          requestedPriority: "Low",
          currentStatus: "NEW",
          requesterUserId: uid,
          categoryId: cat.id,
          relatedSystemId: sys.id,
        },
      });

    [{ id: ticketId }, { id: otherTicketId }] = await Promise.all([makeTicket(ownerId), makeTicket(otherId)]);
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({
      where: { ticket: { requesterUser: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } } },
    });
    await prisma.ticket.deleteMany({
      where: { requesterUser: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } });
    await prisma.category.deleteMany({ where: { name: CAT_NAME } });
    await prisma.relatedSystem.deleteMany({ where: { name: SYS_NAME } });
    await prisma.$disconnect();
  });

  // ── POST /api/tickets/:id/attachments ────────────────────────────────────

  it("should upload a valid JPG file and return 201", async () => {
    const file = makeTempFile("valid", 100_000, ".jpg");
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("Authorization", "Bearer " + authToken)
      .attach("file", file, { contentType: "image/jpeg", filename: "test.jpg" });

    fs.unlinkSync(file);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.fileType).toBe("image/jpeg");
    expect(res.body.isRemoved).toBe(false);
    
    // Validate BR-07: Filename must be stored as UUID v4
    const filename = res.body.fileUrl.split("/uploads/")[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.\w+)?$/i;
    expect(filename).toMatch(uuidRegex);
  });

  it("should upload PNG and PDF files successfully", async () => {
    const png = makeTempFile("valid2", 50_000, ".png");
    const pdf = makeTempFile("valid3", 80_000, ".pdf");

    const [r1, r2] = await Promise.all([
      request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("Authorization", "Bearer " + authToken)
        .attach("file", png, { contentType: "image/png", filename: "img.png" }),
      request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("Authorization", "Bearer " + authToken)
        .attach("file", pdf, { contentType: "application/pdf", filename: "doc.pdf" }),
    ]);

    fs.unlinkSync(png);
    fs.unlinkSync(pdf);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
  });

  it("should reject a file that exceeds 5 MB", async () => {
    const bigFile = makeTempFile("toobig", 6 * 1024 * 1024, ".jpg"); // 6 MB
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("Authorization", "Bearer " + authToken)
      .attach("file", bigFile, { contentType: "image/jpeg", filename: "big.jpg" });

    if (fs.existsSync(bigFile)) fs.unlinkSync(bigFile);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 MB/i);
  });

  it("should reject disallowed MIME type (text/plain)", async () => {
    const txt = makeTempFile("bad_type", 1_000, ".txt");
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("Authorization", "Bearer " + authToken)
      .attach("file", txt, { contentType: "text/plain", filename: "note.txt" });

    if (fs.existsSync(txt)) fs.unlinkSync(txt);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPG|PNG|WEBP|PDF/i);
  });

  it("should return 404 when a different user tries to upload", async () => {
    const f = makeTempFile("unauth", 10_000, ".jpg");
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("Authorization", "Bearer " + otherToken)  // wrong user
      .attach("file", f, { contentType: "image/jpeg", filename: "x.jpg" });

    if (fs.existsSync(f)) fs.unlinkSync(f);
    expect(res.status).toBe(404);
  });

  it("should add up to the 5th attachment and then reject the 6th", async () => {
    // We already have 3 from previous tests. Add 2 more to reach cap of 5.
    for (let i = 0; i < 2; i++) {
      const f = makeTempFile(`cap${i}`, 10_000, ".jpg");
      const r = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("Authorization", "Bearer " + authToken)
        .attach("file", f, { contentType: "image/jpeg", filename: `cap${i}.jpg` });
      if (fs.existsSync(f)) fs.unlinkSync(f);
      expect(r.status).toBe(201);
    }

    // Now the 6th attempt should be rejected
    const f6 = makeTempFile("sixth", 10_000, ".jpg");
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("Authorization", "Bearer " + authToken)
      .attach("file", f6, { contentType: "image/jpeg", filename: "sixth.jpg" });
    if (fs.existsSync(f6)) fs.unlinkSync(f6);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Maximum of 5/i);
  });

  // ── DELETE /api/tickets/:id/attachments/:attachmentId ──────────────────

  it("should soft-remove an attachment (isRemoved=true) and return 200", async () => {
    // Create a fresh ticket + attachment for removal test
    const category = await prisma.category.findFirst({ where: { name: CAT_NAME } });
    const system = await prisma.relatedSystem.findFirst({ where: { name: SYS_NAME } });
    const removableTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIK-RMV-${Date.now()}`,
        summary: "Removable ticket",
        description: "For attachment removal test",
        requestedPriority: "Low",
        currentStatus: "NEW",
        requesterUserId: ownerId,
        categoryId: category!.id,
        relatedSystemId: system!.id,
      },
    });

    const att = await prisma.attachment.create({
      data: {
        ticketId: removableTicket.id,
        fileName: "to_remove.jpg",
        fileUrl: "/uploads/fake_remove.jpg",
        fileType: "image/jpeg",
        fileSize: 1024,
      },
    });

    const res = await request(app)
      .delete(`/api/tickets/${removableTicket.id}/attachments/${att.id}`).set("Authorization", "Bearer " + authToken);

    expect(res.status).toBe(200);
    expect(res.body.attachment.isRemoved).toBe(true);
    expect(res.body.attachment.removedAt).not.toBeNull();

    // Verify in DB it is actually soft-removed and NOT physically deleted
    const inDb = await prisma.attachment.findUnique({ where: { id: att.id } });
    expect(inDb).not.toBeNull();
    expect(inDb!.isRemoved).toBe(true);

    // Ticket detail should no longer show this attachment
    const ticketRes = await request(app)
      .get(`/api/tickets/${removableTicket.id}`).set("Authorization", "Bearer " + authToken);
    expect(ticketRes.body.attachments.find((a: { id: number }) => a.id === att.id)?.isRemoved).toBe(true);

    // Cleanup
    await prisma.attachment.deleteMany({ where: { ticketId: removableTicket.id } });
    await prisma.ticket.delete({ where: { id: removableTicket.id } });
  });

  it("should return 404 when another user tries to soft-remove an attachment", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: "owner_file.jpg",
        fileUrl: "/uploads/fake_owner.jpg",
        fileType: "image/jpeg",
        fileSize: 1024,
        isRemoved: true, // pre-removed so it doesn't count toward cap
      },
    });
    // Use a fresh ticket owned by ownerId; the other user tries to delete
    const freshTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIK-403-${Date.now()}`,
        summary: "403 ownership test",
        description: "Testing forbidden access to soft-remove",
        requestedPriority: "Low",
        currentStatus: "NEW",
        requesterUserId: ownerId,
        categoryId: (await prisma.category.findFirst({ where: { name: CAT_NAME } }))!.id,
        relatedSystemId: (await prisma.relatedSystem.findFirst({ where: { name: SYS_NAME } }))!.id,
      },
    });
    const freshAtt = await prisma.attachment.create({
      data: {
        ticketId: freshTicket.id,
        fileName: "fresh.jpg",
        fileUrl: "/uploads/fresh.jpg",
        fileType: "image/jpeg",
        fileSize: 512,
      },
    });

    const res = await request(app)
      .delete(`/api/tickets/${freshTicket.id}/attachments/${freshAtt.id}`).set("Authorization", "Bearer " + otherToken);
    expect(res.status).toBe(404);

    // Cleanup
    await prisma.attachment.deleteMany({ where: { ticketId: freshTicket.id } });
    await prisma.ticket.delete({ where: { id: freshTicket.id } });
    await prisma.attachment.delete({ where: { id: att.id } });
  });

  // ── GET /api/tickets/:id/attachments/:attachmentId/download ───────────

  it("should return 404 when downloading a soft-removed attachment", async () => {
    const removedAtt = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: "gone.jpg",
        fileUrl: "/uploads/gone.jpg",
        fileType: "image/jpeg",
        fileSize: 512,
        isRemoved: true,
        removedAt: new Date(),
      },
    });

    const res = await request(app)
      .get(`/api/tickets/${ticketId}/attachments/${removedAtt.id}/download`).set("Authorization", "Bearer " + authToken);
    expect(res.status).toBe(404);

    await prisma.attachment.delete({ where: { id: removedAtt.id } });
  });

  it("should return 404 on download when requester does not own the ticket", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: "private.jpg",
        fileUrl: "/uploads/private.jpg",
        fileType: "image/jpeg",
        fileSize: 512,
      },
    });

    const res = await request(app)
      .get(`/api/tickets/${ticketId}/attachments/${att.id}/download`).set("Authorization", "Bearer " + otherToken);
    expect(res.status).toBe(404);

    await prisma.attachment.delete({ where: { id: att.id } });
  });
});
