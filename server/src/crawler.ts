import * as cheerio from "cheerio";
import { FETCH_TIMEOUT_MS, USER_AGENT } from "./config.js";
import type { FetchOutcome, PageData } from "./types.js";

// Elements we treat as CTA candidates. This only collects text — deciding
// which of these count as a *weak* CTA is analysis logic, not scraping.
const CTA_SELECTOR =
  'button, a[class*="btn" i], a[class*="button" i], a[class*="cta" i], a[role="button"], input[type="submit"], input[type="button"]';

function isSameOrigin(a: URL, b: URL): boolean {
  return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "");
}

function extractPageData(
  requestedUrl: string,
  finalUrl: string,
  redirected: boolean,
  statusCode: number,
  serverResponseMs: number,
  htmlDownloadMs: number,
  html: string,
): PageData {
  const $ = cheerio.load(html);
  const base = new URL(finalUrl);

  const title = $("head > title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description" i]').attr("content")?.trim() || null;
  const h1 = $("h1").first().text().trim() || null;
  const h2Count = $("h2").length;

  const ctaTexts = $(CTA_SELECTOR)
    .map((_, el) => {
      const $el = $(el);
      return ($el.text().trim() || $el.attr("value")?.trim() || "").slice(
        0,
        120,
      );
    })
    .get()
    .filter((text) => text.length > 0);

  const images = $("img");
  const imageCount = images.length;
  const imagesMissingAlt = images
    .filter((_, el) => !$(el).attr("alt")?.trim())
    .toArray().length;

  let internalLinksCount = 0;
  let externalLinksCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (
      !href ||
      href.startsWith("#") ||
      /^(mailto|tel|javascript):/i.test(href)
    ) {
      return;
    }
    try {
      const linkUrl = new URL(href, base);
      if (!linkUrl.protocol.startsWith("http")) return;
      if (isSameOrigin(linkUrl, base)) internalLinksCount++;
      else externalLinksCount++;
    } catch {
      // malformed href, ignore
    }
  });

  $("script, style, noscript").remove();
  const wordCount = $("body")
    .text()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return {
    url: requestedUrl,
    finalUrl,
    redirected,
    statusCode,
    fetchOutcome: "ok",
    errorMessage: null,
    loadTimeMs: serverResponseMs + htmlDownloadMs,
    serverResponseMs,
    htmlDownloadMs,
    title,
    metaDescription,
    h1,
    h2Count,
    ctaTexts,
    imageCount,
    imagesMissingAlt,
    internalLinksCount,
    externalLinksCount,
    wordCount,
  };
}

function emptyPageData(
  requestedUrl: string,
  fetchOutcome: FetchOutcome,
  serverResponseMs: number,
  statusCode: number | null,
  errorMessage: string,
): PageData {
  return {
    url: requestedUrl,
    finalUrl: requestedUrl,
    redirected: false,
    statusCode,
    fetchOutcome,
    errorMessage,
    loadTimeMs: serverResponseMs,
    serverResponseMs,
    htmlDownloadMs: 0,
    title: null,
    metaDescription: null,
    h1: null,
    h2Count: 0,
    ctaTexts: [],
    imageCount: 0,
    imagesMissingAlt: 0,
    internalLinksCount: 0,
    externalLinksCount: 0,
    wordCount: 0,
  };
}

// Fetches one page and normalizes it into PageData, also returning the raw
// HTML (needed by the page selector to find internal links on the
// homepage). Never throws — failed fetches, timeouts and HTTP errors are
// all encoded in the returned PageData so the caller can keep going.
export async function fetchPageWithHtml(
  requestedUrl: string,
): Promise<{ page: PageData; html: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(requestedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    // fetch() resolves once response headers arrive — this is the server's
    // side of the round trip (DNS + TCP + TLS + request + first byte),
    // before a single byte of the HTML body has been read.
    const serverResponseMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return {
        page: emptyPageData(
          requestedUrl,
          "http_error",
          serverResponseMs,
          response.status,
          `Request failed with status ${response.status}`,
        ),
        html: null,
      };
    }

    const html = await response.text();
    // Everything after fetch() resolved and before the body finished
    // downloading/decoding — kept separate so a slow serverResponseMs
    // (server-side) can be told apart from a slow htmlDownloadMs (page
    // weight/network throughput).
    const htmlDownloadMs = Math.max(
      0,
      Math.round(performance.now() - startedAt) - serverResponseMs,
    );
    const page = extractPageData(
      requestedUrl,
      response.url,
      response.redirected,
      response.status,
      serverResponseMs,
      htmlDownloadMs,
      html,
    );
    return { page, html };
  } catch (error) {
    const serverResponseMs = Math.round(performance.now() - startedAt);
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      page: emptyPageData(
        requestedUrl,
        isAbort ? "timeout" : "network_error",
        serverResponseMs,
        null,
        isAbort
          ? `Timed out after ${FETCH_TIMEOUT_MS}ms`
          : (error as Error).message,
      ),
      html: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Exposed separately so the page selector can parse the homepage's raw HTML
// without re-fetching it.
export function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (
      !href ||
      href.startsWith("#") ||
      /^(mailto|tel|javascript):/i.test(href)
    ) {
      return;
    }
    try {
      const linkUrl = new URL(href, base);
      if (linkUrl.protocol.startsWith("http") && isSameOrigin(linkUrl, base)) {
        linkUrl.hash = "";
        links.push(linkUrl.toString());
      }
    } catch {
      // malformed href, ignore
    }
  });

  return links;
}
