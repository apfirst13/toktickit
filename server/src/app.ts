import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateTicketNumber } from "./utils/ticket.util.js";
import authRoutes from "./routes/auth.routes.js";

// ── Multer: store uploads in /uploads, 5 MB limit ──────────────────────────
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP and PDF files are allowed"));
    }
  },
});

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

/**
 * Basic health check route for the root endpoint.
 * Returns a simple message indicating the API is running.
 */
// Basic health check route
app.get("/", (req, res) => {
  res.send("TokTickIT API is running!");
});

/**
 * API health check endpoint that returns the service status.
 * Used by clients to verify the API is accessible and operational.
 *
 * @route GET /api/health
 * @returns {object} 200 - Status object with "ok" status and service name
 */
// API health check endpoint - Issue #2
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

/**
 * Retrieves all ticket categories ordered by ID.
 *
 * @route GET /api/categories
 * @returns {object} 200 - Array of category objects
 * @returns {object} 500 - Error message if fetch fails
 */
// Category list - Issue #4
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * Retrieves all active requester users ordered by ID.
 *
 * @route GET /api/requesters
 * @returns {object} 200 - Array of active requester user objects
 * @returns {object} 500 - Error message if fetch fails
 */
// Requester list - Issue #3
app.get("/api/requesters", async (req, res) => {
  try {
    const requesters = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(requesters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch requesters" });
  }
});

/**
 * Retrieves all related systems ordered by ID.
 *
 * @route GET /api/systems
 * @returns {object} 200 - Array of related system objects
 * @returns {object} 500 - Error message if fetch fails
 */
// Related Systems list - Issue #4
app.get("/api/systems", async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch systems" });
  }
});

// GET tickets with pagination and requesterId filtering - Issue #4
app.get("/api/tickets", async (req, res) => {
  try {
    const { requesterId, page = "1", limit = "10", search, categoryId, sortBy } = req.query;

    if (!requesterId || isNaN(Number(requesterId))) {
      return res.status(400).json({ error: "requesterId query parameter is required" });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where: any = { requesterUserId: Number(requesterId) };
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.summary = { contains: search, mode: 'insensitive' };
    }
    if (categoryId && !isNaN(Number(categoryId))) {
      where.categoryId = Number(categoryId);
    }
    
    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: "asc" };
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: true,
          relatedSystem: true,
        },
      }),
      prisma.ticket.count({
        where,
      }),
    ]);

    return res.status(200).json({
      data: tickets,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// GET ticket by ID with ownership check
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const { requesterId } = req.query;
    const ticketId = Number(req.params.id);

    if (!requesterId || isNaN(Number(requesterId))) {
      return res.status(400).json({ error: "requesterId query parameter is required" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        attachments: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterUserId !== Number(requesterId)) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

/**
 * Creates a new support ticket with validation.
 * Validates all required fields and creates a ticket with an auto-generated ticket number.
 *
 * @route POST /api/tickets
 * @param {object} req.body - Ticket creation data
 * @param {string} req.body.summary - Brief summary of the issue (max 200 chars)
 * @param {string} req.body.description - Detailed description (min 20 chars)
 * @param {number} req.body.categoryId - Category ID
 * @param {number} req.body.systemId - Related system ID
 * @param {string} req.body.requestedPriority - Priority level (Low, Medium, or High)
 * @param {number} req.body.requesterId - Requester user ID
 * @returns {object} 201 - Created ticket object with generated ticket number
 * @returns {object} 400 - Validation errors array
 * @returns {object} 500 - Error message if creation fails
 */
// Ticket creation - Issue #4
app.post("/api/tickets", async (req, res) => {
  const { summary, description, categoryId, systemId, requestedPriority, requesterId } = req.body;

  const errors: { field: string; message: string }[] = [];

  if (!summary || typeof summary !== "string" || summary.trim().length === 0) {
    errors.push({ field: "summary", message: "Summary is required." });
  } else if (summary.trim().length > 200) {
    errors.push({ field: "summary", message: "Summary must not exceed 200 characters." });
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required." });
  } else if (description.trim().length < 20) {
    errors.push({ field: "description", message: "Description must be at least 20 characters." });
  }

  if (!categoryId || isNaN(Number(categoryId))) {
    errors.push({ field: "categoryId", message: "Category is required." });
  }

  if (!systemId || isNaN(Number(systemId))) {
    errors.push({ field: "systemId", message: "Related system is required." });
  }

  const validPriorities = ["Low", "Medium", "High"];
  if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
    errors.push({ field: "requestedPriority", message: "Priority must be Low, Medium, or High." });
  }

  if (!requesterId || isNaN(Number(requesterId))) {
    errors.push({ field: "requesterId", message: "Requester ID is required." });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // 5. Foreign Key Validation
    const [category, system, requester] = await Promise.all([
      prisma.category.findUnique({ where: { id: Number(categoryId) } }),
      prisma.relatedSystem.findUnique({ where: { id: Number(systemId) } }),
      prisma.user.findUnique({ where: { id: Number(requesterId) } }),
    ]);

    if (!category) errors.push({ field: "categoryId", message: "Category not found." });
    if (!system) errors.push({ field: "systemId", message: "Related system not found." });
    if (!requester) errors.push({ field: "requesterId", message: "Requester not found." });

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // 4. Ticket Number Generation (Secure & Race-condition free)
    const secureTicketNumber = generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: secureTicketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority,
        currentStatus: "NEW",
        requesterUserId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(systemId),
      },
    });

    return res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ error: "Failed to create ticket" });
  }
});


// ── POST /api/tickets/:id/attachments  ─────────────────────────────────────
// Real file upload via multipart/form-data. Validates: ownership, 5-file cap,
// 5 MB size limit, allowed MIME types.
app.post("/api/tickets/:id/attachments", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File exceeds 5 MB limit" });
      }
      return res.status(400).json({ error: err.message ?? "Upload error" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const requesterId = Number(req.body.requesterId);

    if (!requesterId || isNaN(requesterId)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "requesterId is required" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: { where: { isRemoved: false } } },
    });

    if (!ticket) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterUserId !== requesterId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    if (ticket.attachments.length >= 5) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Maximum of 5 active attachments allowed per ticket" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    return res.status(201).json(attachment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add attachment" });
  }
});

// ── GET /api/tickets/:id/attachments/:attachmentId/download  ────────────────
app.get("/api/tickets/:id/attachments/:attachmentId/download", async (req, res) => {
  try {
    const { requesterId } = req.query;
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    if (!requesterId || isNaN(Number(requesterId))) {
      return res.status(400).json({ error: "requesterId query parameter is required" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== Number(requesterId)) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId) {
      return res.status(404).json({ error: "Attachment not found" });
    }
    if (attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment has been removed" });
    }

    const filePath = path.resolve(UPLOAD_DIR, path.basename(attachment.fileUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
    res.setHeader("Content-Type", attachment.fileType);
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Download failed" });
  }
});

// ── DELETE /api/tickets/:id/attachments/:attachmentId  ──────────────────────
// Soft-remove: sets isRemoved=true, removedAt timestamp, and removalReason.
app.delete("/api/tickets/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const { requesterId } = req.query;
    const { removalReason } = req.body;
    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    if (!requesterId || isNaN(Number(requesterId))) {
      return res.status(400).json({ error: "requesterId query parameter is required" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.requesterUserId !== Number(requesterId)) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ticketId !== ticketId || attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment not found or already removed" });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: { isRemoved: true, removedAt: new Date(), removalReason },
    });

    return res.status(200).json({ message: "Attachment removed successfully", attachment: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove attachment" });
  }
});

export { app };
export default app;