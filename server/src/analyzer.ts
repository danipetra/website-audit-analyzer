import type { Issue, PageData, Severity } from "./types.js";

/**
 * Severity per issue type. 
 */
export const ISSUE_SEVERITY: Record<string, Severity> = {
  // critical = the page can't do its core job (be reached, be found, be identified)
  http_error: "critical", // page didn't load
  timeout: "critical", // 
  network_error: "critical", // 
  missing_title: "critical", // no identifiable/clickable element
  very_slow_page: "critical", // >3s just for the HTML — server-is-the-problem, effectively unreachable for many

  // warning = quality is degraded but the page still works
  missing_h1: "warning", // loses a reinforcing relevance signal
  missing_meta_description: "warning", // affects CTR, not indexability; Google often rewrites it
  slow_page: "warning", // 0.8-3s server-side: fetch time, not UX metric
  images_missing_alt: "warning", // a11y + image SEO loss, content still consumable
  low_content: "warning", // thin content lowers the rank
  too_many_external_links: "warning", // dilutes authority, minor
  duplicate_title: "warning", // SERP cannibalisation
  missing_cta: "warning", // conversion/UX gap, not SEO; page type may correctly have no CTA
  weak_cta: "warning", // conversion friction, page still informs
};

/**
 * Numeric thresholds behind the checks below
 *
 * Load time is serverResponseMs + htmlDownloadMs (see server/src/crawler.ts):
 * from the start of the request to the last byte of the HTML body, server
 * round trip and body download both included. That number is noisy, so the
 * bars are generous:
 *   - 800ms  -> slow_page (warning): roughly Google's "good" TTFB boundary
 *   - 3000ms -> very_slow_page (critical): server-is-the-problem territory
 *     where even with measurement noise the page is effectively
 *     unreachable for a large share of visitors
 */
export const THRESHOLDS = {
  slowPageWarnMs: 800,
  slowPageCriticalMs: 3000,
  minWordCount: 150,
  minExternalLinksToFlag: 5, // don't flag tiny pages on a 2-vs-1 difference
};

/**
 * My definition of a weak CTA
 * Only judge the button text, which is all the static-HTML crawler
 * can see. A CTA text is weak if it fails ANY of three checks:
 *
 *   A. No action verb — it's a navigation label ("Products"), not a
 *      call to action. A CTA without a verb doesn't tell the user what
 *      clicking does.
 *   B. Length outside 2–6 words — one word ("Submit") gives no context;
 *      too long also is problematic.
 *   C. Known generic phrases — ex: "learn more" 
 */
const ACTION_VERBS = [
  // IT imperatives common in CTAs
  "scopri", "richiedi", "prenota", "scarica", "inizia", "prova", "contatta",
  "contattaci", "chiama", "acquista", "compra", "ordina", "iscriviti",
  "registrati", "calcola", "scegli", "ottieni", "fissa", "candidati",
  // EN
  "get", "start", "try", "download", "book", "request", "contact", "call",
  "buy", "order", "subscribe", "register", "join", "claim", "unlock",
  "schedule", "apply", "shop", "browse",
];

const GENERIC_CTA_PHRASES = new Set([
  "clicca qui", "clicca", "scopri di più", "scopri", "leggi di più",
  "leggi tutto", "vai", "invia", "continua", "guarda", "qui",
  "click here", "click", "learn more", "read more", "submit", "here",
  "go", "continue", "more", "more info", "find out more", "see more",
]);

export function isWeakCta(ctaText: string): boolean {
  const text = ctaText.trim().toLowerCase();
  if (!text) return true;

  const words = text.split(/\s+/);
  if (words.length < 2 || words.length > 6) return true; // B
  if (GENERIC_CTA_PHRASES.has(text)) return true; // C
  if (!words.some((w) => ACTION_VERBS.includes(w))) return true; // A

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

  // Tiered — this is server-side time to return the HTML document only (see THRESHOLDS).
  if (page.loadTimeMs > THRESHOLDS.slowPageCriticalMs) {
    issues.push(
      makeIssue(page.url, "very_slow_page", `Page took ${page.loadTimeMs}ms to return its HTML`)
    );
  } else if (page.loadTimeMs > THRESHOLDS.slowPageWarnMs) {
    issues.push(
      makeIssue(page.url, "slow_page", `Page took ${page.loadTimeMs}ms to return its HTML`)
    );
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

  // A page that links out more than it links inward isn't guiding visitors
  // deeper into this site — a site-architecture / UX signal. Floored so a
  // tiny page isn't flagged on a 2-vs-1 difference.
  if (
    page.externalLinksCount >= THRESHOLDS.minExternalLinksToFlag &&
    page.externalLinksCount > page.internalLinksCount
  ) {
    issues.push(
      makeIssue(
        page.url,
        "too_many_external_links",
        `${page.externalLinksCount} external links vs ${page.internalLinksCount} internal`
      )
    );
  }

  // missing_cta: no CTA candidate at all. weak_cta: one or more of the
  // page's CTAs reads weak — flag those even if a strong CTA is also present.
  const weakCtas = page.ctaTexts.filter(isWeakCta);
  if (page.ctaTexts.length === 0) {
    issues.push(makeIssue(page.url, "missing_cta", "No CTA-like element detected"));
  } else if (weakCtas.length > 0) {
    issues.push(
      makeIssue(page.url, "weak_cta", `Weak CTA text: ${weakCtas.join(", ")}`)
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
