const fs = require('fs');

let ctrl = fs.readFileSync('server/src/controllers/tickets.controller.ts', 'utf8');

const newCode = `
export const addPublicComment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId) {
      return res.status(403).json({ error: "Forbidden" });
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
    const requesterId = req.user.id;
    const ticketId = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== requesterId) {
      return res.status(403).json({ error: "Forbidden" });
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
`;

if (!ctrl.includes('addPublicComment')) {
  ctrl = ctrl + newCode;
  fs.writeFileSync('server/src/controllers/tickets.controller.ts', ctrl, 'utf8');
}

let routes = fs.readFileSync('server/src/routes/tickets.routes.ts', 'utf8');
if (!routes.includes('addPublicComment')) {
  routes = routes.replace(
    'removeAttachment\n} from \'../controllers/tickets.controller.js\';', 
    'removeAttachment,\n  addPublicComment,\n  setAppearsResolved\n} from \'../controllers/tickets.controller.js\';'
  );
  routes = routes.replace(
    'export default router;', 
    'router.post(\'/:id/comments\', addPublicComment);\nrouter.post(\'/:id/appears-resolved\', setAppearsResolved);\n\nexport default router;'
  );
  fs.writeFileSync('server/src/routes/tickets.routes.ts', routes, 'utf8');
}
