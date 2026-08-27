import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";

const app = express();


app.use(cors());
app.use(express.json());

// Basic health check route
app.get("/", (req, res) => {
  res.send("TokTickIT API is running!");
});

// API health check endpoint - Issue #2
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

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

