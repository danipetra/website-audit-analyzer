import { Router } from "express";
import { runAudit } from "../auditRunner.js";

export const auditRouter = Router();

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

auditRouter.post("/audit", async (req, res) => {
  const { url } = req.body ?? {};

  if (typeof url !== "string" || !isValidHttpUrl(url)) {
    res.status(400).json({ error: "Provide a valid http(s) URL in the 'url' field." });
    return;
  }

  const result = await runAudit(url);
  res.json(result);
});
