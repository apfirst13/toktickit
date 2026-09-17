import { Router } from 'express';
import { getUsers, createUser, updateUser, resetPassword } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply auth middleware and Administrator role check to all routes in this file
router.use(authenticate, requireRole(['ADMINISTRATOR']));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.post('/:id/reset-password', resetPassword);

export default router;
