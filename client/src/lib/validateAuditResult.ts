import type { AuditResult } from "@/types/audit";

// Loose shape check for imported JSON files — enough to catch an obviously
// wrong file and show a clear error, not full schema validation.
export function isAuditResult(data: unknown): data is AuditResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.requestedUrl === "string" &&
    Array.isArray(d.pages) &&
    typeof d.summary === "object" &&
    d.summary !== null &&
    typeof (d.summary as Record<string, unknown>).overallScore === "number"
  );
}
