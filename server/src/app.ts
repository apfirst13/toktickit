import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get("/", (req, res) => {
  res.send("TokTickIT API is running!");
});


// API health check endpoint - Issue #2
app.get("/api/health", (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      service: "TokTickIT API",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Service unavailable",
    });
  }
});


export { app };
export default app;
