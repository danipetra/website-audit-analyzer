import type { Issue, PageData, Severity } from "./types.js";

/**
 * Points deducted from a page's starting score of 100, per issue
 * severity.Reasoning in the README. 
 * The 2.5:1 ratio is the point: criticals cost more than warnings.
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 20,
  warning: 8,
};

export function calculatePageScore(page: PageData, issues: Issue[]): number {
  // A page that didn't load has no value to a visitor or to search
  if (page.fetchOutcome !== "ok") return 0;

  const deduction = issues.reduce((total, issue) => total + SEVERITY_WEIGHTS[issue.severity], 0);
  return Math.max(0, 100 - deduction);
}

export function calculateOverallScore(pageScores: number[]): number {
  if (pageScores.length === 0) return 0;
  const sum = pageScores.reduce((total, score) => total + score, 0);
  return Math.round(sum / pageScores.length);
}
