import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/prisma.js';
import bcrypt from 'bcrypt';

describe('Authentication API', () => {
  let activeUserId: number;
  let inactiveUserId: number;
  let activeToken: string;

  beforeAll(async () => {
    // Clear the test users if they exist
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test_active@toktickit.com', 'test_inactive@toktickit.com', 'test_change_pw@toktickit.com']
        }
      }
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const activeUser = await prisma.user.create({
      data: {
        email: 'test_active@toktickit.com',
        fullName: 'Active Test User',
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      }
    });
    activeUserId = activeUser.id;

    const inactiveUser = await prisma.user.create({
      data: {
        email: 'test_inactive@toktickit.com',
        fullName: 'Inactive Test User',
        passwordHash,
        isActive: false,
        mustChangePassword: true,
      }
    });
    inactiveUserId = inactiveUser.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test_active@toktickit.com', 'test_inactive@toktickit.com', 'test_change_pw@toktickit.com']
        }
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 and session data for valid credentials (AC-01, BR-01)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_active@toktickit.com', password: 'Password123!' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: 'test_active@toktickit.com'
      });

      activeToken = res.body.token; // save for later tests
    });

    it('should return 401 for invalid credentials (BR-01)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_active@toktickit.com', password: 'WrongPassword' });
      
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password.' });
    });

    it('should return 401 for an inactive account (BR-01)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_inactive@toktickit.com', password: 'Password123!' });
      
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password.' });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the session and return 200', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 and current user data when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test_active@toktickit.com');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should allow user with mustChangePassword=true to set a new password and clear the flag (AC-02, FR-02)', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({ newPassword: 'NewStrongPassword123!' });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Password updated successfully' });

      // Verify flag is cleared
      const updatedUser = await prisma.user.findUnique({ where: { id: activeUserId } });
      expect(updatedUser?.mustChangePassword).toBe(false);

      // Verify new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_active@toktickit.com', password: 'NewStrongPassword123!' });
      expect(loginRes.status).toBe(200);
    });

    it('should return 400 if validation constraints fail', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({ newPassword: 'short' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

});
