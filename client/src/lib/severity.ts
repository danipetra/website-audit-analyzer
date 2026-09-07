import type { Severity } from "@/types/audit";

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
};

export const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
};
