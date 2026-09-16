import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, category, status, requestedPriority, itPriority, assignedTo, sortBy, sortOrder } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    let limitNumber = Math.max(1, parseInt(limit as string) || 10);
    if (limitNumber > 50) limitNumber = 50;

    const sortFields = ['createdAt', 'requestedPriority', 'itPriority', 'currentStatus'];
    const validSortBy = sortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = { name: { equals: category as string, mode: 'insensitive' } };
    if (status) where.currentStatus = status;
    if (requestedPriority) where.requestedPriority = requestedPriority;
    if (itPriority) where.itPriority = itPriority;

    if (assignedTo === 'unassigned') {
      where.assignedStaffId = null;
    } else if (assignedTo && !isNaN(Number(assignedTo))) {
      where.assignedStaffId = Number(assignedTo);
    }

    const total = await prisma.ticket.count({ where });
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { [validSortBy]: validSortOrder },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      include: {
        category: { select: { name: true } },
        relatedSystem: { select: { name: true } },
        requesterUser: { select: { fullName: true } },
        assignedStaff: { select: { fullName: true } }
      }
    });

    const ticketDTOs = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      summary: ticket.summary,
      description: ticket.description,
      currentStatus: ticket.currentStatus,
      requestedPriority: ticket.requestedPriority,
      itPriority: ticket.itPriority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      categoryId: ticket.categoryId,
      relatedSystemId: ticket.relatedSystemId,
      requesterUserId: ticket.requesterUserId,
      assignedStaffId: ticket.assignedStaffId,
      category: ticket.category,
      relatedSystem: ticket.relatedSystem,
      requesterUser: ticket.requesterUser ? { fullName: ticket.requesterUser.fullName } : null,
      assignedStaff: ticket.assignedStaff ? { fullName: ticket.assignedStaff.fullName } : null
    }));

    res.status(200).json({
      data: ticketDTOs,
      pagination: {
        total,
        page: pageNumber,
        pageSize: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};
export const getActiveStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['IT_STAFF', 'ADMINISTRATOR'] },
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        role: true
      }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch active staff' });
  }
};

export const updateTicket = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const ticketId = Number(req.params.id);
    const { assignedStaffId, itPriority, status } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates: any = {};

    if (assignedStaffId !== undefined) {
      if (assignedStaffId === null) {
        updates.assignedStaffId = null;
      } else {
        const staffUser = await prisma.user.findUnique({ where: { id: Number(assignedStaffId) } });
        if (!staffUser || !staffUser.isActive || !['IT_STAFF', 'ADMINISTRATOR'].includes(staffUser.role)) {
          return res.status(400).json({ error: 'Invalid assignment: User must be active IT_STAFF or ADMINISTRATOR' });
        }
        updates.assignedStaffId = Number(assignedStaffId);
      }
    }

    if (itPriority) {
      updates.itPriority = itPriority;
    }

    if (status && status !== ticket.currentStatus) {
      const current = ticket.currentStatus;
      const target = status;
      
      const allowedTransitions: Record<string, string[]> = {
        NEW: ['OPEN', 'CANCELLED'],
        OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'CANCELLED'],
        IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
        WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED'],
        RESOLVED: ['CLOSED', 'REOPENED'],
        REOPENED: ['IN_PROGRESS'],
        CLOSED: [],
        CANCELLED: []
      };

      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(target)) {
        return res.status(400).json({ error: `Invalid status transition from ${current} to ${target}` });
      }
      updates.currentStatus = target;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updates
    });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
};
