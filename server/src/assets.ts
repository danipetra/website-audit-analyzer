import * as cheerio from "cheerio";
import { FETCH_TIMEOUT_MS, MAX_ASSETS_PER_PAGE, USER_AGENT } from "./config.js";
import type { AssetInfo, AssetType } from "./types.js";

const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".zip",
];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

function extensionOf(url: string): string {
  const path = new URL(url).pathname;
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot).toLowerCase();
}

// Collects up to MAX_ASSETS_PER_PAGE image/video/document links from a
// page's markup, in DOM order (same "first = more important" reasoning as
// pageSelector.ts's page selection). Any origin — asset CDNs are normal.
export function extractAssetLinks(
  html: string,
  baseUrl: string,
): { url: string; type: AssetType }[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const links: { url: string; type: AssetType }[] = [];

  function add(raw: string | undefined, type: AssetType) {
    if (!raw) return;
    try {
      const abs = new URL(raw, base).toString();
      if (seen.has(abs)) return;
      seen.add(abs);
      links.push({ url: abs, type });
    } catch {
      // malformed URL, ignore
    }
  }

  $("img[src]").each((_, el) => add($(el).attr("src"), "image"));
  $("video[src]").each((_, el) => add($(el).attr("src"), "video"));
  $("video source[src]").each((_, el) => add($(el).attr("src"), "video"));
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const ext = extensionOf(new URL(href, base).toString());
      if (DOCUMENT_EXTENSIONS.includes(ext)) add(href, "document");
      else if (VIDEO_EXTENSIONS.includes(ext)) add(href, "video");
    } catch {
      // malformed href, ignore
    }
  });

  return links.slice(0, MAX_ASSETS_PER_PAGE);
}

// Times a HEAD request for one asset — falling back to a ranged GET
// (bytes=0-0) for servers that reject HEAD, and cancelling that response's
// body immediately so a server that ignores the Range header doesn't end up
// streaming the whole file to us anyway. Never reads/keeps the asset itself.
async function checkAsset(
  url: string,
): Promise<{
  ok: boolean;
  bytes: number | null;
  contentType: string | null;
  fetchMs: number;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    let bytes: number | null = null;
    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      bytes = contentLength ? Number(contentLength) : null;
    } else {
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Range: "bytes=0-0" },
      });
      // Content-Length on a 206 response is the size of the one-byte range,
      // not the file — the real total is in Content-Range ("bytes 0-0/N").
      const contentRange = response.headers.get("content-range");
      const total = contentRange?.match(/\/(\d+)$/)?.[1];
      bytes = total ? Number(total) : null;
      await response.body?.cancel();
    }

    return {
      ok: response.ok || response.status === 206,
      bytes,
      contentType: response.headers.get("content-type"),
      fetchMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      ok: false,
      bytes: null,
      contentType: null,
      fetchMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectPageAssets(
  html: string,
  baseUrl: string,
): Promise<AssetInfo[]> {
  const links = extractAssetLinks(html, baseUrl);
  return Promise.all(
    links.map(async ({ url, type }) => ({
      url,
      type,
      ...(await checkAsset(url)),
    })),
  );
}
