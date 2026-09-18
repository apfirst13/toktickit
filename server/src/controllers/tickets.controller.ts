import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../prisma.js';
import { generateTicketNumber } from '../utils/ticket.util.js';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve('uploads');

export const getTickets = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const { page = "1", limit = "10", search, categoryId, sortBy } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = { requesterUserId: requesterId };
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.summary = { contains: search, mode: 'insensitive' };
    }
    if (categoryId && !isNaN(Number(categoryId))) {
      where.categoryId = Number(categoryId);
    }
    
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "priority_desc") {
      orderBy = { requestedPriority: "desc" };
    } else if (sortBy === "priority_asc") {
      orderBy = { requestedPriority: "asc" };
    } else if (sortBy === "status") {
      orderBy = { currentStatus: "asc" };
    }

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { name: true } },
          relatedSystem: { select: { name: true } },
        }
      })
    ]);

    return res.status(200).json({
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

export const getTicketById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { name: true } },
        relatedSystem: { select: { name: true } },
        attachments: true,
        requesterUser: { select: { fullName: true } },
        assignedStaff: { select: { fullName: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterUserId !== requesterId && !['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch ticket details" });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No session found.' });
  }
  const { summary, description, requestedPriority, categoryId, systemId } = req.body;
  const requesterId = req.user.id;

  const errors = [];
  
  if (!summary || summary.trim() === "") {
    errors.push({ field: "summary", message: "Summary is required." });
  } else if (summary.trim().length > 200) {
    errors.push({ field: "summary", message: "Summary cannot exceed 200 characters." });
  }

  if (!description || description.trim() === "") {
    errors.push({ field: "description", message: "Description is required." });
  } else if (description.trim().length < 20) {
    errors.push({ field: "description", message: "Description must be at least 20 characters." });
  }

  if (!categoryId || isNaN(Number(categoryId))) {
    errors.push({ field: "categoryId", message: "Category is required." });
  }

  if (!systemId || isNaN(Number(systemId))) {
    errors.push({ field: "systemId", message: "Related system is required." });
  }

  const validPriorities = ["Low", "Medium", "High"];
  if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
    errors.push({ field: "requestedPriority", message: "Priority must be Low, Medium, or High." });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const [category, system, requester] = await Promise.all([
      prisma.category.findUnique({ where: { id: Number(categoryId) } }),
      prisma.relatedSystem.findUnique({ where: { id: Number(systemId) } }),
      prisma.user.findUnique({ where: { id: Number(requesterId) } }),
    ]);

    if (!category) errors.push({ field: "categoryId", message: "Category not found." });
    if (!system) errors.push({ field: "systemId", message: "Related system not found." });
    if (!requester) errors.push({ field: "requesterId", message: "Requester not found." });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const secureTicketNumber = generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: secureTicketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority.toUpperCase(),
        currentStatus: "NEW",
        requesterUserId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(systemId),
      },
    });

    return res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ error: "Failed to create ticket" });
  }
};

export const uploadAttachment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const ticketId = Number(req.params.id);
    const requesterId = req.user.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: true },
    });

    if (!ticket) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterUserId !== requesterId && !['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.attachments.length >= 5) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Maximum of 5 active attachments allowed per ticket" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    return res.status(201).json(attachment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add attachment" });
  }
};

export const downloadAttachment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId && !['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({ error: "Attachment not found" });
    }
    if (attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment has been removed" });
    }

    const filePath = path.resolve(UPLOAD_DIR, path.basename(attachment.fileUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
    res.setHeader("Content-Type", attachment.fileType);
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Download failed" });
  }
};

export const removeAttachment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const { removalReason } = req.body;
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId && !['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId || attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment not found or already removed" });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: { isRemoved: true, removedAt: new Date(), removalReason },
    });

    return res.status(200).json({ message: "Attachment removed successfully", attachment: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove attachment" });
  }
};

export const addPublicComment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const comment = await prisma.publicComment.create({
      data: {
        content,
        ticketId,
        authorId: requesterId
      }
    });
    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add comment" });
  }
};

export const setAppearsResolved = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.currentStatus === "RESOLVED" || ticket.currentStatus === "CLOSED") {
      return res.status(400).json({ error: "Cannot mark resolved ticket as appears resolved" });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { appearsResolved: true }
    });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to set appears resolved" });
  }
};
export const getInternalNotes = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    if (!['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Only IT Staff and Administrators can access internal notes' });
    }
    const ticketId = Number(req.params.id);
    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { fullName: true, role: true } } }
    });
    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

export const addInternalNote = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No session found.' });
    }
    if (!['IT_STAFF', 'ADMINISTRATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const ticketId = Number(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const note = await prisma.internalNote.create({
      data: {
        content,
        ticketId,
        authorId: req.user.id
      },
      include: { author: { select: { fullName: true, role: true } } }
    });
    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create note' });
  }
};