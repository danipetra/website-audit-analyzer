import { extractLinksFromHtml } from "./crawler.js";
import { MAX_INTERNAL_PAGES } from "./config.js";

const NON_PAGE_EXTENSIONS =
  /\.(pdf|jpe?g|png|gif|svg|webp|zip|rar|mp4|mp3|css|js|json|xml|ico|woff2?|ttf)$/i;

// Picks which internal pages to crawl alongside the homepage: same-origin
// links found in the homepage HTML, in DOM order, deduped by path and
// excluding the homepage itself and obvious non-HTML assets.
export function selectInternalPages(homepageHtml: string, homepageUrl: string): string[] {
  const homepagePath = new URL(homepageUrl).pathname.replace(/\/$/, "") || "/";
  const candidates = extractLinksFromHtml(homepageHtml, homepageUrl);

  const seenPaths = new Set([homepagePath]);
  const selected: string[] = [];

  for (const link of candidates) {
    if (selected.length >= MAX_INTERNAL_PAGES) break;

    const path = new URL(link).pathname.replace(/\/$/, "") || "/";
    if (seenPaths.has(path) || NON_PAGE_EXTENSIONS.test(path)) continue;

    seenPaths.add(path);
    selected.push(link);
  }

  return selected;
}
