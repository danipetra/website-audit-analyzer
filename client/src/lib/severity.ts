import type { Severity } from "@/types/audit";

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
};

export const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
};

// Score band shared by the hero and the pages table. Mirrors the scoring
// narrative in the README: one critical or a pile of warnings drops a page
// below 80 ("needs work"); below 50 is "poor".
export type ScoreBand = "good" | "warning" | "poor";

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

export const SCORE_BAND_TEXT_CLASS: Record<ScoreBand, string> = {
  good: "text-emerald-700",
  warning: "text-amber-700",
  poor: "text-red-700",
};

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  good: "Good",
  warning: "Needs work",
  poor: "Poor",
};
