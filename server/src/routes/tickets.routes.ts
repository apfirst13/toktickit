import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getTickets,
  getTicketById,
  createTicket,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
  addPublicComment,
  setAppearsResolved
} from '../controllers/tickets.controller.js';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP and PDF files are allowed'));
    }
  },
});

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.post('/:id/attachments', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File exceeds 5 MB limit' });
      }
      return res.status(400).json({ error: err.message ?? 'Upload error' });
    }
    next();
  });
}, uploadAttachment);
router.get('/:id/attachments/:attachmentId/download', downloadAttachment);
router.delete('/:id/attachments/:attachmentId', removeAttachment);

router.post('/:id/comments', addPublicComment);
router.post('/:id/appears-resolved', setAppearsResolved);

export default router;
