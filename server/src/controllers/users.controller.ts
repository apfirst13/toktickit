import { Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

function excludePasswordHash(user: any) {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, role, isActive } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search } },
        { fullName: { contains: search } }
      ];
    }

    if (role && typeof role === 'string') {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: 'asc' }
    });

    res.status(200).json(users.map(excludePasswordHash));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, fullName, role, initialPassword } = req.body;

    if (!email || !fullName || !role || !initialPassword) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        passwordHash,
        mustChangePassword: true,
        isActive: true
      }
    });

    res.status(201).json(excludePasswordHash(newUser));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, fullName, role, isActive } = req.body;

    const targetUserId = parseInt(id);
    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // AC-13: duplicate email check (excluding self)
    if (email && email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        res.status(409).json({ error: 'Email already in use by another user' });
        return;
      }
    }

    // AC-06, BR-08: Admin Safety Guards
    const isDeactivating = isActive === false && targetUser.isActive === true;
    const isRemovingAdminRole = role !== undefined && role !== 'ADMINISTRATOR' && targetUser.role === 'ADMINISTRATOR';

    if ((isDeactivating || isRemovingAdminRole) && targetUser.role === 'ADMINISTRATOR' && targetUser.isActive === true) {
      if (req.user?.id === targetUserId) {
        res.status(400).json({ error: 'Administrators cannot deactivate or change role of themselves' });
        return;
      }

      // Check if this is the last active admin
      const activeAdminsCount = await prisma.user.count({
        where: { role: 'ADMINISTRATOR', isActive: true }
      });

      if (activeAdminsCount <= 1) {
        res.status(400).json({ error: 'Cannot remove the last active administrator in the system' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(email !== undefined && { email }),
        ...(fullName !== undefined && { fullName }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    res.status(200).json(excludePasswordHash(updatedUser));
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { initialPassword } = req.body;

    if (!initialPassword) {
      res.status(400).json({ error: 'initialPassword is required' });
      return;
    }

    const targetUserId = parseInt(id);
    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePassword: true
      }
    });

    res.status(200).json(excludePasswordHash(updatedUser));
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
