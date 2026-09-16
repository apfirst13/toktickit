import { Router } from 'express';
import { getQueue } from '../controllers/staff.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/queue', requireRole(['IT_STAFF', 'ADMINISTRATOR']), getQueue);

export default router;
