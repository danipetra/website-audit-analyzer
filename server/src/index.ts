import express from "express";
import { auditRouter } from "./routes/audit.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());
app.use("/api", auditRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Audit server listening on http://localhost:${PORT}`);
});
