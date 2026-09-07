import type { Issue, PageData, Severity } from "./types.js";

/**
 * Severity per issue type. This is your call per the assignment brief
 * ("define your own severity levels ... explain the reasoning in the
 * README"). The values below are a starting placeholder so the pipeline
 * runs end to end — decide which of these are actually critical vs
 * warning and why.
 */
export const ISSUE_SEVERITY: Record<string, Severity> = {
  missing_title: "critical",
  missing_meta_description: "warning",
  missing_h1: "critical",
  http_error: "critical",
  timeout: "critical",
  network_error: "critical",
  slow_page: "warning",
  images_missing_alt: "warning",
  low_content: "warning",
  too_many_external_links: "warning",
  duplicate_title: "warning",
  weak_cta: "warning",
  missing_cta: "warning",
};

/**
 * Numeric thresholds behind the checks below. Also your call — these are
 * placeholders, tune them and explain the reasoning in the README.
 */
export const THRESHOLDS = {
  slowPageMs: 3000,
  minWordCount: 150,
  maxExternalLinks: 10,
};

/**
 * TODO: this is the actual definition of "weak CTA" — there is no
 * standard one, the brief explicitly wants yours. `page.ctaTexts` (see
 * crawler.ts) currently just collects any non-empty text from
 * button-like elements; decide here what makes one weak (too generic —
 * "click here", "submit" — too short, no action verb, ...).
 */
function isWeakCta(ctaText: string): boolean {
  return false;
}

function makeIssue(pageUrl: string, type: string, message: string): Issue {
  return { pageUrl, type, message, severity: ISSUE_SEVERITY[type] ?? "warning" };
}

export function analyzePage(page: PageData): Issue[] {
  const issues: Issue[] = [];

  if (page.fetchOutcome !== "ok") {
    issues.push(
      makeIssue(page.url, page.fetchOutcome, page.errorMessage ?? "Page failed to load")
    );
    return issues;
  }

  if (!page.title) {
    issues.push(makeIssue(page.url, "missing_title", "Page has no <title> tag"));
  }
  if (!page.metaDescription) {
    issues.push(makeIssue(page.url, "missing_meta_description", "Page has no meta description"));
  }
  if (!page.h1) {
    issues.push(makeIssue(page.url, "missing_h1", "Page has no <h1>"));
  }

  if (page.loadTimeMs > THRESHOLDS.slowPageMs) {
    issues.push(makeIssue(page.url, "slow_page", `Page took ${page.loadTimeMs}ms to load`));
  }

  if (page.imagesMissingAlt > 0) {
    issues.push(
      makeIssue(
        page.url,
        "images_missing_alt",
        `${page.imagesMissingAlt} of ${page.imageCount} images missing alt text`
      )
    );
  }

  if (page.wordCount < THRESHOLDS.minWordCount) {
    issues.push(makeIssue(page.url, "low_content", `Only ${page.wordCount} words of content`));
  }

  if (page.externalLinksCount > THRESHOLDS.maxExternalLinks) {
    issues.push(
      makeIssue(page.url, "too_many_external_links", `${page.externalLinksCount} external links`)
    );
  }

  if (page.ctaTexts.length === 0) {
    issues.push(makeIssue(page.url, "missing_cta", "No CTA-like element detected"));
  } else if (page.ctaTexts.every(isWeakCta)) {
    issues.push(
      makeIssue(page.url, "weak_cta", `CTA text(s) look weak: ${page.ctaTexts.join(", ")}`)
    );
  }

  return issues;
}

/**
 * Cross-page check: flags titles that are identical across crawled pages.
 * "Similar" is intentionally simple for now (case-insensitive exact match
 * after trimming) — tighten this (e.g. fuzzy match) if you want to catch
 * near-duplicates too.
 */
export function checkDuplicateTitles(pages: PageData[]): Issue[] {
  const pagesByNormalizedTitle = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.title) continue;
    const normalized = page.title.trim().toLowerCase();
    const urls = pagesByNormalizedTitle.get(normalized) ?? [];
    urls.push(page.url);
    pagesByNormalizedTitle.set(normalized, urls);
  }

  const issues: Issue[] = [];
  for (const urls of pagesByNormalizedTitle.values()) {
    if (urls.length < 2) continue;
    for (const url of urls) {
      issues.push(makeIssue(url, "duplicate_title", "Title is identical to another crawled page"));
    }
  }
  return issues;
}
