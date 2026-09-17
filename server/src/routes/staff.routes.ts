import { Router } from 'express';
import { getQueue, getActiveStaff, updateTicket } from '../controllers/staff.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/queue', requireRole(['IT_STAFF', 'ADMINISTRATOR']), getQueue);
router.get('/users', requireRole(['IT_STAFF', 'ADMINISTRATOR']), getActiveStaff);
router.patch('/tickets/:id', requireRole(['IT_STAFF', 'ADMINISTRATOR']), updateTicket);

export default router;
