import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;
