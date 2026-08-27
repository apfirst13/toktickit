import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";

const app = express();


app.use(cors());
app.use(express.json());

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
    const requesters = await prisma.requesterUser.findMany({
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
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TIK-TEMP",
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority,
        currentStatus: "New",
        requesterUserId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(systemId),
      },
    });

    // Update with zero-padded ID
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { ticketNumber: `TIK-${String(ticket.id).padStart(5, "0")}` },
    });

    return res.status(201).json(updated);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ error: "Failed to create ticket" });
  }
});

export { app };
export default app;

