import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getRequesterDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    const [myOpen, inProgress, resolved, closed, recentlyUpdated] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: { in: ['NEW', 'OPEN'] }
        }
      }),
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: { in: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER'] }
        }
      }),
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: 'RESOLVED'
        }
      }),
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: 'CLOSED'
        }
      }),
      prisma.ticket.findMany({
        where: {
          requesterUserId: userId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          category: true,
          assignedStaff: { select: { fullName: true } }
        }
      })
    ]);

    res.status(200).json({
      metrics: {
        myOpen,
        inProgress,
        resolved,
        closed
      },
      recentlyUpdated
    });
  } catch (error) {
    console.error('Failed to fetch requester dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
