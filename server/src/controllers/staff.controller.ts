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

    res.status(200).json({
      data: tickets,
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
