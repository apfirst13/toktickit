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

export { app };
export default app;

