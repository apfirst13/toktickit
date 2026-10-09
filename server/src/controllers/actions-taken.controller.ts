import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const prisma = new PrismaClient();

export const getActionsTaken = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user!.role === 'REQUESTER' && ticket.requesterUserId !== req.user!.id) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      include: {
        performedBy: {
          select: { id: true, fullName: true, role: true }
        }
      },
      orderBy: { actionDateTime: 'asc' }
    });

    return res.status(200).json(actions);
  } catch (error) {
    console.error('Error fetching actions taken:', error);
    return res.status(500).json({ error: 'Failed to fetch actions taken' });
  }
};

export const createActionTaken = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    // Only IT Staff and Admins can create actions taken
    if (req.user!.role === 'REQUESTER') {
      return res.status(403).json({ error: 'Forbidden: Only IT Staff and Administrators can add actions taken' });
    }

    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { actionDateTime, description, result, followUpRequired, followUpNote, attachmentNotes } = req.body;

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!result || result.trim() === '') {
      return res.status(400).json({ error: 'Result is required' });
    }

    if (followUpRequired && (!followUpNote || followUpNote.trim() === '')) {
      return res.status(400).json({ error: 'Follow-up note is required when follow-up is required' });
    }

    const newAction = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime: actionDateTime ? new Date(actionDateTime) : new Date(),
        description,
        result,
        performedById: req.user!.id,
        followUpRequired: followUpRequired || false,
        followUpNote: followUpRequired ? followUpNote : null,
        attachmentNotes: attachmentNotes || null,
        version: 1
      },
      include: {
        performedBy: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });

    return res.status(201).json(newAction);
  } catch (error) {
    console.error('Error creating action taken:', error);
    return res.status(500).json({ error: 'Failed to create action taken' });
  }
};

export const updateActionTaken = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    // Only IT Staff and Admins can update actions taken
    if (req.user!.role === 'REQUESTER') {
      return res.status(403).json({ error: 'Forbidden: Only IT Staff and Administrators can update actions taken' });
    }

    const ticketId = Number(req.params.id);
    const actionId = Number(req.params.actionId);
    if (isNaN(ticketId) || isNaN(actionId)) {
      return res.status(400).json({ error: 'Invalid ticket ID or action ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const existingAction = await prisma.actionTaken.findUnique({
      where: { id: actionId }
    });

    if (!existingAction || existingAction.ticketId !== ticketId) {
      return res.status(404).json({ error: 'Action taken not found' });
    }

    const { actionDateTime, description, result, followUpRequired, followUpNote, attachmentNotes, version } = req.body;

    if (version === undefined || version === null) {
      return res.status(400).json({ error: 'Version is required for optimistic concurrency control' });
    }

    if (existingAction.version !== version) {
      return res.status(409).json({ error: 'Conflict: The action taken has been updated by another user. Please refresh and try again.' });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!result || result.trim() === '') {
      return res.status(400).json({ error: 'Result is required' });
    }

    if (followUpRequired && (!followUpNote || followUpNote.trim() === '')) {
      return res.status(400).json({ error: 'Follow-up note is required when follow-up is required' });
    }

    const updatedAction = await prisma.actionTaken.update({
      where: { id: actionId },
      data: {
        actionDateTime: actionDateTime ? new Date(actionDateTime) : existingAction.actionDateTime,
        description,
        result,
        followUpRequired: followUpRequired,
        followUpNote: followUpRequired ? followUpNote : null,
        attachmentNotes: attachmentNotes !== undefined ? attachmentNotes : existingAction.attachmentNotes,
        version: { increment: 1 }
      },
      include: {
        performedBy: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });

    return res.status(200).json(updatedAction);
  } catch (error) {
    console.error('Error updating action taken:', error);
    return res.status(500).json({ error: 'Failed to update action taken' });
  }
};
