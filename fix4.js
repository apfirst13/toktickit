const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/tickets.controller.ts', 'utf8');

// Replace forbidden 403 with 404 to prevent existence leak
c = c.replace(/if \(ticket\.requesterUserId !== requesterId\) \{\s*return res\.status\(403\)\.json\(\{ error: "Forbidden: You do not own this ticket" \}\);\s*\}/g, 'if (ticket.requesterUserId !== requesterId) {\n      return res.status(404).json({ error: "Ticket not found" });\n    }');
c = c.replace(/if \(ticket\.requesterUserId !== requesterId\) \{\s*if \(req\.file\) fs\.unlinkSync\(req\.file\.path\);\s*return res\.status\(403\)\.json\(\{ error: "Forbidden: You do not own this ticket" \}\);\s*\}/g, 'if (ticket.requesterUserId !== requesterId) {\n      if (req.file) fs.unlinkSync(req.file.path);\n      return res.status(404).json({ error: "Ticket not found" });\n    }');
c = c.replace(/if \(ticket\.requesterUserId !== requesterId\) \{\s*return res\.status\(403\)\.json\(\{ error: "Forbidden" \}\);\s*\}/g, 'if (ticket.requesterUserId !== requesterId) {\n      return res.status(404).json({ error: "Ticket not found" });\n    }');

fs.writeFileSync('server/src/controllers/tickets.controller.ts', c, 'utf8');
