import { fetchPage, fetchPageWithHtml } from "./crawler.js";
import { selectInternalPages } from "./pageSelector.js";
import { analyzePage, checkDuplicateTitles } from "./analyzer.js";
import { calculateOverallScore, calculatePageScore } from "./scoring.js";
import type { AuditResult, AuditSummary, Issue, PageAuditResult, PageData } from "./types.js";

function buildSummary(pages: PageAuditResult[], overallScore: number): AuditSummary {
  const successfulPages = pages.filter((p) => p.page.fetchOutcome === "ok");
  const failedPages = pages.filter((p) => p.page.fetchOutcome !== "ok");
  const allIssues = pages.flatMap((p) => p.issues);

  const totalLoadTime = successfulPages.reduce((sum, p) => sum + p.page.loadTimeMs, 0);

  return {
    overallScore,
    totalPages: pages.length,
    successfulPages: successfulPages.length,
    failedPages: failedPages.length,
    criticalIssues: allIssues.filter((i) => i.severity === "critical").length,
    warnings: allIssues.filter((i) => i.severity === "warning").length,
    averageLoadTimeMs: successfulPages.length
      ? Math.round(totalLoadTime / successfulPages.length)
      : 0,
    pagesMissingTitle: successfulPages.filter((p) => !p.page.title).length,
    pagesMissingMetaDescription: successfulPages.filter((p) => !p.page.metaDescription).length,
    pagesMissingH1: successfulPages.filter((p) => !p.page.h1).length,
    totalImagesMissingAlt: pages.reduce((sum, p) => sum + p.page.imagesMissingAlt, 0),
    detectedCtaCount: pages.reduce((sum, p) => sum + p.page.ctaTexts.length, 0),
  };
}

export async function runAudit(requestedUrl: string): Promise<AuditResult> {
  const { page: homepage, html: homepageHtml } = await fetchPageWithHtml(requestedUrl);

  const internalUrls =
    homepage.fetchOutcome === "ok" && homepageHtml
      ? selectInternalPages(homepageHtml, homepage.finalUrl)
      : [];

  const internalPages = await Promise.all(internalUrls.map((url) => fetchPage(url)));
  const allPages: PageData[] = [homepage, ...internalPages];

  const duplicateTitleIssues = checkDuplicateTitles(allPages);
  const duplicateTitleIssuesByUrl = new Map<string, Issue[]>();
  for (const issue of duplicateTitleIssues) {
    const existing = duplicateTitleIssuesByUrl.get(issue.pageUrl) ?? [];
    existing.push(issue);
    duplicateTitleIssuesByUrl.set(issue.pageUrl, existing);
  }

  const pageResults: PageAuditResult[] = allPages.map((page) => {
    const issues = [...analyzePage(page), ...(duplicateTitleIssuesByUrl.get(page.url) ?? [])];
    return { page, issues, score: calculatePageScore(page, issues) };
  });

  const overallScore = calculateOverallScore(pageResults.map((p) => p.score));

  return {
    requestedUrl,
    generatedAt: new Date().toISOString(),
    pages: pageResults,
    summary: buildSummary(pageResults, overallScore),
  };
}
