import { Router } from 'express';
import { getRequesterDashboard, getStaffDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/requester', authenticate, requireRole(['REQUESTER']), getRequesterDashboard);
router.get('/staff', authenticate, requireRole(['IT_STAFF', 'ADMINISTRATOR']), getStaffDashboard);

export default router;
