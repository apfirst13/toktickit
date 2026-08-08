import express from "express";
import cors from "cors";

// 1. ประกาศตัวแปร app
const app = express();

// 2. ตั้งค่า Middleware
app.use(cors());
app.use(express.json());

// 3. สร้าง Endpoint /api/health
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// 4. Export ทั้งแบบ Named Export ({ app }) และ Default Export (app)
export { app };
export default app;