import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-lab3';

let staffToken: string;
let requesterToken: string;
let ticketId: number;

describe('Comments and Notes API', () => {
  beforeAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { in: ['staff_note@test.com', 'req_note@test.com'] } } });

    const staff = await prisma.user.create({ data: { fullName: 'Staff Note', email: 'staff_note@test.com', passwordHash: 'x', role: 'IT_STAFF' } });
    const reqUser = await prisma.user.create({ data: { fullName: 'Req Note', email: 'req_note@test.com', passwordHash: 'x', role: 'REQUESTER' } });

    staffToken = jwt.sign({ userId: staff.id, role: staff.role }, JWT_SECRET);
    requesterToken = jwt.sign({ userId: reqUser.id, role: reqUser.role }, JWT_SECRET);

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    const t = await prisma.ticket.create({
      data: { ticketNumber: 'T-NOTE-1', summary: 'T1', description: 'D1', requestedPriority: 'LOW', currentStatus: 'NEW', requesterUserId: reqUser.id, categoryId: cat!.id, relatedSystemId: sys!.id, itPriority: 'LOW' }
    });
    ticketId = t.id;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { in: ['staff_note@test.com', 'req_note@test.com'] } } });
  });

  it('should return 403 without leaking data when requester accesses notes (SEC-03)', async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}/notes`).set('Authorization', 'Bearer ' + requesterToken);
    expect(res.status).toBe(403);
    
    const resPost = await request(app).post(`/api/tickets/${ticketId}/notes`).set('Authorization', 'Bearer ' + requesterToken).send({ content: 'Secret Note' });
    expect(resPost.status).toBe(403);
  });

  it('should return 201 when IT staff creates an internal note (API-08)', async () => {
    const res = await request(app).post(`/api/tickets/${ticketId}/notes`).set('Authorization', 'Bearer ' + staffToken).send({ content: 'Secret Note' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Secret Note');

    const getRes = await request(app).get(`/api/tickets/${ticketId}/notes`).set('Authorization', 'Bearer ' + staffToken);
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].content).toBe('Secret Note');
  });
});
