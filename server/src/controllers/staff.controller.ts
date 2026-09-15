import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getQueue = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { page, limit, search, category, status, requestedPriority, itPriority, assignedTo, sortBy, sortOrder } = req.query;

    const pageNum = parseInt(page as string, 10);
    const validPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;

    const limitNum = parseInt(limit as string, 10);
    let validLimit = isNaN(limitNum) || limitNum < 1 ? 10 : limitNum;
    if (validLimit > 50) validLimit = 50;

    const validSortBy = ['createdAt', 'requestedPriority', 'itPriority', 'currentStatus'].includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase()) ? String(sortOrder).toLowerCase() : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = { name: category as string };
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
      skip: (validPage - 1) * validLimit,
      take: validLimit,
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
        page: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(total / validLimit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};
