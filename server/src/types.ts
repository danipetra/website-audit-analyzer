export type Severity = "critical" | "warning";

export type FetchOutcome = "ok" | "http_error" | "timeout" | "network_error";

export interface PageData {
  url: string;
  finalUrl: string;
  redirected: boolean;
  statusCode: number | null;
  fetchOutcome: FetchOutcome;
  errorMessage: string | null;
  loadTimeMs: number;
  serverResponseMs: number;
  htmlDownloadMs: number;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Count: number;
  ctaTexts: string[];
  imageCount: number;
  imagesMissingAlt: number;
  internalLinksCount: number;
  externalLinksCount: number;
  wordCount: number;
}

export interface Issue {
  pageUrl: string;
  type: string;
  message: string;
  severity: Severity;
}

export type AssetType = "image" | "video" | "document";

// A media/document link found on a page, checked with HEAD (or a ranged GET
// fallback) — never downloaded. Purely informational: does not feed into
// issues or scoring.
export interface AssetInfo {
  url: string;
  type: AssetType;
  ok: boolean;
  bytes: number | null;
  contentType: string | null;
  fetchMs: number;
}

export interface PageAuditResult {
  page: PageData;
  issues: Issue[];
  score: number;
  assets: AssetInfo[];
}

export interface AuditSummary {
  overallScore: number;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  criticalIssues: number;
  warnings: number;
  averageLoadTimeMs: number;
  pagesMissingTitle: number;
  pagesMissingMetaDescription: number;
  pagesMissingH1: number;
  totalImagesMissingAlt: number;
  detectedCtaCount: number;
  weakCtaCount: number;
}

export interface AuditResult {
  requestedUrl: string;
  generatedAt: string;
  pages: PageAuditResult[];
  summary: AuditSummary;
}
