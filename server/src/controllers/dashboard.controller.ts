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

    // BR-01: OPEN card = OPEN + REOPENED. In Progress = IN_PROGRESS only. Waiting = WAITING_FOR_REQUESTER.
    const [myOpen, inProgress, waiting, resolved, closed, recentlyUpdated] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: { in: ['OPEN', 'REOPENED'] }
        }
      }),
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: 'IN_PROGRESS'
        }
      }),
      prisma.ticket.count({
        where: {
          requesterUserId: userId,
          currentStatus: 'WAITING_FOR_REQUESTER'
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
        waiting,
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

export const getStaffDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const role = req.user.role;

    // BR-01: OPEN card = OPEN + REOPENED (consistent with queue ?status=OPEN,REOPENED)
    // BR-09: Urgent = HIGH or URGENT priority, excluding terminal states
    const [newCount, openCount, inProgressCount, waitingCount, myAssignedCount, urgentCount, recentTickets, totalUsers] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: 'NEW' } }),
      prisma.ticket.count({ where: { currentStatus: { in: ['OPEN', 'REOPENED'] } } }),
      prisma.ticket.count({ where: { currentStatus: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { currentStatus: 'WAITING_FOR_REQUESTER' } }),
      prisma.ticket.count({
        where: {
          assignedStaffId: userId,
          currentStatus: { notIn: ['CLOSED', 'CANCELLED'] }
        }
      }),
      prisma.ticket.count({
        where: {
          OR: [
            { requestedPriority: { in: ['HIGH', 'URGENT'] } },
            { itPriority: { in: ['HIGH', 'URGENT'] } }
          ],
          currentStatus: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] }
        }
      }),
      prisma.ticket.findMany({
        where: { currentStatus: { notIn: ['CLOSED', 'CANCELLED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          category: true,
          assignedStaff: { select: { fullName: true } }
        }
      }),
      role === 'ADMINISTRATOR' ? prisma.user.count() : Promise.resolve(0)
    ]);

    res.status(200).json({
      metrics: {
        new: newCount,
        open: openCount,
        inProgress: inProgressCount,
        waiting: waitingCount,
        myAssigned: myAssignedCount,
        urgent: urgentCount,
        ...(role === 'ADMINISTRATOR' && { totalUsers })
      },
      recentlyUpdated: recentTickets
    });
  } catch (error) {
    console.error('Failed to fetch staff dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
