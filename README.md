# Website Audit Collector & Analyzer

Bliss Agency technical assignment.

## How to install and run

```bash
npm install     # installs client + server (npm workspaces)
npm run dev      # runs Express (port 4000) and Next.js (port 3000) together
```

Open http://localhost:3000. The Next.js dev server proxies `/api/*` to the
Express server (see `client/next.config.ts`), so the browser only ever talks
to one origin.

## Stack used

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + Recharts
- **Backend**: Express (TypeScript) — chosen over Next.js API routes to match
  the stack mentioned in Bliss's job listing
- **Scraping**: native `fetch` + `cheerio`, no headless browser

<!-- TODO: expand if you add/change anything -->

## Scraping approach

<!-- TODO: describe the crawl flow — homepage first, then up to 4 internal
pages selected from same-origin links found on the homepage (see
server/src/pageSelector.ts). One fetch per page, timeout via AbortController. -->

## Crawl limits and timeout handling

<!-- TODO: state the numbers from server/src/config.ts (timeout ms, max
internal pages) and explain what happens on timeout / HTTP error / network
error — see server/src/crawler.ts and the `fetchOutcome` field. -->

## Assumptions made

<!-- TODO -->

## How internal pages were selected

<!-- TODO: explain the heuristic in server/src/pageSelector.ts in your own
words, and why it's a reasonable proxy for "important" pages. -->

## Definition of a CTA, and what makes one weak

<!-- TODO: this is your call. server/src/crawler.ts collects CTA *candidates*
(buttons, button-like links) — server/src/analyzer.ts's `isWeakCta` is where
you decide what makes one weak. -->

## Severity levels

<!-- TODO: explain critical vs warning and why, referencing
server/src/analyzer.ts's ISSUE_SEVERITY map. -->

## Scoring rules and weights

<!-- TODO: explain the formula and why the weights in
server/src/scoring.ts's SEVERITY_WEIGHTS are what they are. -->

## AI tools usage

<!-- TODO: be specific and honest — which tools, for which parts, what you
changed. -->

## Known limitations

<!-- TODO -->

## What I'd improve with more time

<!-- TODO -->
