import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    '🚨 CRITICAL: JWT_SECRET environment variable is NOT SET!\n' +
    'Please set it before running the app:\n' +
    '  export JWT_SECRET=your-secure-256-bit-random-key\n' +
    'Example: JWT_SECRET=$(openssl rand -hex 32) npm start'
  );
}

/**
 * Login endpoint - authenticates user with email and password
 * 
 * @route POST /api/auth/login
 * @param {Request} req - Express request object
 * @param {Request.body.email} req.body.email - User email address
 * @param {Request.body.password} req.body.password - User password (plaintext)
 * @param {Response} res - Express response object
 * 
 * @returns {200} { token, user } - JWT token and user data
 * @returns {400} { error } - Missing email or password
 * @returns {401} { error } - Invalid credentials (email or password wrong)
 * @returns {403} { error } - Account is inactive
 * @returns {500} { error } - Server error
 * 
 * @security Uses bcrypt.compare() to safely verify passwords (BR-01)
 * @security Generic error messages to prevent user enumeration (BR-01)
 * @security Blocks inactive users (BR-04)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.warn(`[AUTH] Failed login attempt - email: ${email}, IP: ${req.ip}`);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Log failed attempt for security monitoring
      console.warn(`[AUTH] Failed login attempt for email: ${email}`);
      // ℹ️ Future: Add to audit log table for compliance
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is inactive. Please contact your administrator.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout endpoint - clears user session
 * 
 * @route POST /api/auth/logout
 * @returns {200} { message } - Logout successful
 * 
 * For stateless JWT, true logout requires token blacklist.
 * This would need Redis or database to store revoked tokens.
 * 
 * Future implementation:
 * 1. Extract token from Authorization header
 * 2. Add to blacklist (Redis: SET blacklist:{token} 1 EX 86400)
 * 3. Check blacklist in middleware before verifying JWT
 * 
 * For now, logout is client-side only (delete token from localStorage)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
};

/**
 * Get current user endpoint - returns authenticated user data
 * 
 * @route GET /api/auth/me
 * @middleware authenticate - requires valid JWT token
 * @param {AuthenticatedRequest} req - Request with user info
 * @param {Response} res - Express response object
 * 
 * @returns {200} { id, email, fullName, role, mustChangePassword, isActive }
 * @returns {401} { error } - Not authenticated
 * @returns {404} { error } - User not found (shouldn't happen normally)
 * @returns {500} { error } - Server error
 * 
 * @security Excludes passwordHash from response (no sensitive data leak)
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        mustChangePassword: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function
const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { valid: true };
};

/**
 * Change password endpoint - updates user password and clears mustChangePassword flag
 * 
 * @route POST /api/auth/change-password
 * @middleware authenticate - requires valid JWT token
 * @param {AuthenticatedRequest} req - Request with user info
 * @param {Request.body.newPassword} req.body.newPassword - New password (minimum 8 chars)
 * @param {Response} res - Express response object
 * 
 * @returns {200} { message } - Password changed successfully
 * @returns {400} { error } - Password too short (< 8 characters)
 * @returns {401} { error } - Not authenticated
 * @returns {500} { error } - Server error
 * 
 * @security Uses bcrypt.hash() with salt rounds=10 to securely hash password
 * @security Clears mustChangePassword flag after successful change (FR-02)
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { newPassword } = req.body;

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false
      }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
