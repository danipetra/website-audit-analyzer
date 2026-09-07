import type { Issue, Severity } from "./types.js";

/**
 * Points deducted from a page's starting score of 100, per issue
 * severity. Your call per the brief ("define your own scoring rules ...
 * explain why the weights are what they are") — placeholders below.
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 20,
  warning: 8,
};

export function calculatePageScore(issues: Issue[]): number {
  const deduction = issues.reduce((total, issue) => total + SEVERITY_WEIGHTS[issue.severity], 0);
  return Math.max(0, 100 - deduction);
}

export function calculateOverallScore(pageScores: number[]): number {
  if (pageScores.length === 0) return 0;
  const sum = pageScores.reduce((total, score) => total + score, 0);
  return Math.round(sum / pageScores.length);
}
