import { Router } from 'express';
import { getActionsTaken, createActionTaken, updateActionTaken } from '../controllers/actions-taken.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Routes for /api/tickets/:id/actions
router.get('/', getActionsTaken);
router.post('/', createActionTaken);
router.patch('/:actionId', updateActionTaken);

export default router;
