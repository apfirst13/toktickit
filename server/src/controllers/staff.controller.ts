import { buildTicketWhereClause } from '../utils/ticket-query.util.js';
import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, category, status, requestedPriority, itPriority, assignedTo, sortBy, sortOrder, isUrgent } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    let limitNumber = Math.max(1, parseInt(limit as string) || 10);
    if (limitNumber > 50) limitNumber = 50;

    const sortFields = ['createdAt', 'requestedPriority', 'itPriority', 'currentStatus'];
    const validSortBy = sortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // BR-08: assignedTo=me resolves to logged-in staff user ID
    const resolvedAssignedTo = assignedTo === 'me'
      ? req.user?.id
      : assignedTo === 'unassigned'
        ? 'unassigned'
        : assignedTo && !isNaN(Number(assignedTo)) ? Number(assignedTo) : undefined;

    let where: any;
    try {
      where = buildTicketWhereClause({
        search: search as string,
        categoryName: category as string,
        status: status as string,
        isUrgent: isUrgent === 'true',
        requestedPriority: requestedPriority as string,
        itPriority: itPriority as string,
        assignedStaffId: resolvedAssignedTo as any,
      });
    } catch (e: any) {
      if (e.message === 'INVALID_STATUS_FILTER') {
        res.status(400).json({ error: 'Invalid status filter' });
        return;
      }
      throw e;
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
      if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(itPriority)) {
        return res.status(400).json({ error: 'Invalid IT Priority' });
      }
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

      if (target === 'RESOLVED') {
        const actionCount = await prisma.actionTaken.count({
          where: { ticketId }
        });
        if (actionCount === 0) {
          return res.status(400).json({ error: 'Cannot transition to RESOLVED: At least one Action Taken is required' });
        }
      }

      updates.currentStatus = target;
    }

    // BR-10: Optimistic locking — expectedStatus is optional. If omitted, use current DB status (no stale check).
    // If provided, compare strictly and return 409 if mismatch.
    const expectedStatus = req.body.expectedStatus;
    const expected = expectedStatus || ticket.currentStatus;

    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        currentStatus: expected
      },
      data: updates
    });

    if (updateResult.count === 0) {
      return res.status(409).json({ error: 'Conflict: Ticket status has changed since you last viewed it. Please refresh.' });
    }

    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
};
