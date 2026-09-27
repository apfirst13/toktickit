import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-lab3';

let staffToken: string;
let requesterToken: string;
let testTicketId: number;
let existingActionId: number;
let staffUserId: number;
let requesterUserId: number;

describe('Lab 4 - Actions Taken API', () => {
  beforeAll(async () => {
    // Make sure we have the required users
    const staff = await prisma.user.upsert({
      where: { email: 'staff1@toktickit.com' },
      update: {},
      create: {
        email: 'staff1@toktickit.com',
        passwordHash: 'dummy',
        fullName: 'Staff 1',
        role: 'IT_STAFF',
        isActive: true,
        mustChangePassword: false
      }
    });
    const reqUser = await prisma.user.upsert({
      where: { email: 'req1@toktickit.com' },
      update: {},
      create: {
        email: 'req1@toktickit.com',
        passwordHash: 'dummy',
        fullName: 'Requester 1',
        role: 'REQUESTER',
        isActive: true,
        mustChangePassword: false
      }
    });
    
    staffUserId = staff.id;
    requesterUserId = reqUser.id;

    staffToken = jwt.sign({ userId: staff.id, role: staff.role, email: staff.email }, JWT_SECRET, { expiresIn: '1h' });
    requesterToken = jwt.sign({ userId: reqUser.id, role: reqUser.role, email: reqUser.email }, JWT_SECRET, { expiresIn: '1h' });

    // Ensure we have a category and system
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: 'Test Category' } });
    }
    
    let system = await prisma.relatedSystem.findFirst();
    if (!system) {
      system = await prisma.relatedSystem.create({ data: { name: 'Test System' } });
    }

    // Create a fresh ticket for actions
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TEST-ACT-${Date.now()}`,
        summary: 'Action test ticket',
        requestedPriority: 'Low',
        categoryId: category.id,
        relatedSystemId: system.id,
        requesterUserId: reqUser.id,
      }
    });
    testTicketId = ticket.id;
  });

  afterAll(async () => {
    if (testTicketId) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.ticket.delete({ where: { id: testTicketId } });
    }
    await prisma.$disconnect();
  });

  it('API-03: Should reject POST from Requester (403)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        description: 'Requester trying to add action',
        result: 'Should fail'
      });
      
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('API-02: Should reject POST if followUpRequired is true but followUpNote is missing (400)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Need to follow up',
        result: 'Checking',
        followUpRequired: true
      });
      
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Follow-up note is required');
  });

  it('API-01: Should allow POST from IT Staff (201)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Restarted the server',
        result: 'System is back online',
        followUpRequired: false
      });
      
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Restarted the server');
    expect(res.body.version).toBe(1);
    expect(res.body.performedById).toBe(staffUserId);
    
    existingActionId = res.body.id;
  });

  it('Should reject PATCH from Requester (403)', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/actions/${existingActionId}`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        description: 'Requester hacking edit',
        result: 'Should fail',
        version: 1
      });
      
    expect(res.status).toBe(403);
  });

  it('API-05: Should reject PATCH if version is stale (409)', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/actions/${existingActionId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Stale update',
        result: 'Will fail',
        version: 999 // Intentionally wrong version
      });
      
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Conflict');
  });

  it('API-04: Should allow PATCH if version matches (200)', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/actions/${existingActionId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Restarted the server (edited)',
        result: 'System is back online and stable',
        followUpRequired: true,
        followUpNote: 'Monitor for 24 hours',
        version: 1 // Correct version from creation
      });
      
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Restarted the server (edited)');
    expect(res.body.followUpNote).toBe('Monitor for 24 hours');
    expect(res.body.version).toBe(2); // Should increment
  });
  
  it('Should allow GET from Requester who owns the ticket (200)', async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/actions`)
      .set('Authorization', `Bearer ${requesterToken}`);
      
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].performedBy).toBeDefined();
  });
});
