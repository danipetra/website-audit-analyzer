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

export interface PageAuditResult {
  page: PageData;
  issues: Issue[];
  score: number;
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
}

export interface AuditResult {
  requestedUrl: string;
  generatedAt: string;
  pages: PageAuditResult[];
  summary: AuditSummary;
}
