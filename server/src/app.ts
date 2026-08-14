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

export { app };
export default app;
