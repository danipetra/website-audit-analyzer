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

Three ways to populate the dashboard:

- **Run audit** — enter a public URL, real crawl (homepage + up to 4
  internal pages).
- **Load sample data** — loads the bundled `client/public/sample-audit.json`
  without touching the network.
- **Import JSON file** — upload a saved audit result; it's shape-checked
  (`client/src/lib/validateAuditResult.ts`) before it's accepted.

`sample-audit.json` is **hand-crafted, then run through the real analyzer
and scorer** (so its issues and scores always match the live pipeline). It
deliberately contains 6 pages rather than a realistic 5, to exercise every
issue type plus the `http_error` and `timeout` failure modes in one file.

## Stack used

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + Recharts
- **Backend**: Express (TypeScript) — chosen over Next.js API routes to match
  the stack mentioned in Bliss's job listing
- **Scraping**: native `fetch` + `cheerio`, no headless browser — the
  brief's data points are all readable from static HTML, so a browser
  engine would be cost without payoff at this scale. The trade-off
  (client-rendered content, CTA presentation) is covered under *Known
  limitations*.
- **Charts**: Recharts (React, SVG).

## Scraping approach

1. **Fetch the homepage** with native `fetch` (Node), following redirects,
   with a browser-like `User-Agent` (see `server/src/config.ts`).
2. **Parse it with `cheerio`** — a server-side HTML parser, no browser, no
   JS execution. From the raw markup it reads: `<title>`, meta description,
   first `<h1>`, `<h2>` count, CTA-candidate text, image count + images
   with no usable `alt`, internal vs external link counts, and an
   estimated word count (`<body>` text with `<script>/<style>/<noscript>`
   stripped, split on whitespace).
3. **Pick up to 4 internal pages** from the homepage's same-origin links
   (see *How internal pages were selected*) and fetch each one the same
   way. Internal pages are fetched **concurrently** (`Promise.all`).
4. **Analyse and score** every page, then build the summary.

`loadTimeMs` is the server-side round trip of *our* `fetch` for that page
— roughly the target's TTFB plus HTML download plus our network latency to
it. **It is not a front-end/UX performance metric** (no assets, no render,
no JS) and it's a single measurement with no retry or median.

Origin comparison ignores a leading `www.` (`example.com` and
`www.example.com` count as the same site). Links to `#…`, `mailto:`,
`tel:`, `javascript:` and non-HTTP protocols are ignored.

## Crawl limits and timeout handling

| Limit | Value | Where |
| --- | --- | --- |
| Per-request timeout | **8000 ms** | `FETCH_TIMEOUT_MS` in `server/src/config.ts` |
| Max internal pages | **4** (+ the homepage = 5 fetches) | `MAX_INTERNAL_PAGES` |
| Crawl depth | 1 — only links found on the homepage, we don't recurse | `server/src/pageSelector.ts` |

Each fetch is wrapped in an `AbortController` armed with that timeout. The
crawler **never throws** — every failure mode is encoded on the page's
`fetchOutcome` field and the audit continues:

| `fetchOutcome` | When | Recorded as |
| --- | --- | --- |
| `ok` | 2xx response | normal analysis |
| `http_error` | response received but not `ok` (404, 500, …) | one `critical` issue, page data left empty, `statusCode` kept |
| `timeout` | `AbortController` fired before the response | one `critical` issue, `statusCode: null` |
| `network_error` | DNS failure, connection refused, TLS error, … | one `critical` issue, `statusCode: null` |

Redirects are followed automatically (`redirect: "follow"`); the page
records `redirected: true` and the resolved `finalUrl`. If the **homepage**
fails, there's nothing to extract internal links from, so the audit
returns just that one failed page.

A failed page is scored **0** (see *Scoring*).

## Assumptions made

- The site is a conventional server-rendered (or pre-rendered) website.
  A client-only SPA that ships an empty `<body>` and fills it with JS will
  look empty to the crawler — this is a known limitation, not a handled
  case.
- The homepage links to the pages that matter. It doesn't read
  `sitemap.xml` or the nav menu specifically.
- One CTA convention: calls to action are marked up as buttons or
  button-like links (`btn` / `button` / `cta` class, `role="button"`,
  submit inputs). Text-only links styled as CTAs purely via CSS are
  missed.
- Italian + English content for the CTA copy checks (the verb and
  generic-phrase lists are IT + EN).
- `alt=""` counts as *missing* alt text. Intentional empty alt on
  decorative images will be flagged — acceptable noise at this scale.
- The audit is run from a server with normal outbound internet access and
  no site-specific allow-listing; some sites will block or rate-limit the
  bot `User-Agent`.

## How internal pages were selected


It takes the same-origin links in the homepage HTML, **in DOM order**, and
keep the first 4 after:

- dropping the homepage itself,
- de-duplicating by path (so `/about`, `/about/`, `/about#team` count
  once),
- skipping obvious non-HTML assets by extension (`.pdf`, `.jpg`, `.zip`,
  `.css`, …).

DOM order is a deliberate, cheap proxy for importance: primary navigation,
hero links and top-of-page content come first in the markup, so the pages
a site puts first are usually the ones it considers most important. It's
not perfect — a site could bury its nav at the end of the DOM — but it
needs no heuristics to defend and no extra requests. See
`server/src/pageSelector.ts`.

## Definition of a CTA, and what makes one weak

**What is treaten as a CTA.** The crawler collects CTA *candidates*: the text
of button-like elements — `<button>`, and links/elements with a
`btn` / `button` / `cta` class or `role="button"` (see
`server/src/crawler.ts`).

**What makes one weak.** Only judges the button *text* — that's all a
static-HTML crawler can see (no rendering, no JS execution, no analytics). A CTA text is weak if it
fails **any** of:

- **A — no action verb.** The text contains no imperative verb, so it's a
  navigation label ("Products", "Newsletter"), not a call to action.
- **B — length outside 2–6 words.** One word ("Submit", "Go") gives no
  context; too long can't be parsed at a glance.
- **C — a known generic phrase.** "Learn more", "click here", "scopri di
  più" — technically verbs, but they communicate nothing about the
  outcome.

See `isWeakCta` in `server/src/analyzer.ts`. The `weak_cta` issue fires
only when *every* CTA on a page is weak (i.e. the page has no strong CTA).
If no CTA candidate is found at all, that's `missing_cta` instead.

**Known limits of this check** (see also *What I'd improve*):

- The action-verb list is curated, not exhaustive — a rare verb that's
  missing would be a false positive.
- We can detect the *absence* of supporting copy near a CTA but not judge
  its quality (that would need NLP — out of scope here).
- We can't assess CTA presentation: a blocking modal vs a slide-in, timing
  of appearance, above/below the fold. That needs a headless browser,
  which is outside the chosen stack. CTAs injected at runtime by
  third-party popup builders are invisible to us for the same reason;
  CTAs present in the markup and merely revealed later via CSS/JS are
  seen fine.

## Severity levels


Two levels, deliberately. The question for every issue is the same:
**does the page still achieve its purpose — be found, be read, convert —
or not?** If not, it's `critical`. If the flaw degrades quality but the
page still works, it's `warning`. More granularity (info / minor / major)
wouldn't change what you'd actually do about each issue, so it isn't worth
the complexity at this scale.

The one place magnitude matters is load time: the same underlying check
splits into `slow_page` (warning) and `very_slow_page` (critical) at the
point where slowness stops being friction and starts costing the page its
audience.

**Critical** — the page can't do its core job:

| Issue | Why critical |
| --- | --- |
| `http_error`, `timeout`, `network_error` | The page doesn't load. Nothing else matters. |
| `missing_title` | The `<title>` is the clickable headline in search results, the tab label, and the social share fallback. Without it the page is effectively unidentifiable and unclickable in search. |
| `very_slow_page` | The server took more than **3s** to return *just the HTML* — before a single asset or any rendering. Our load-time number is noisy (one fetch, no median, includes our own latency to the target), so the bar is set high on purpose: past 3s for the bare document the server itself is the problem, and even allowing for measurement error the page is effectively unreachable for a large share of visitors. |

**Warning** — quality is degraded but the page still works:

| Issue | Why only a warning |
| --- | --- |
| `missing_h1` | Loses a relevance signal that reinforces the title and an accessibility landmark for screen readers, but Google has stated an H1 is not a ranking dealbreaker — the page is still indexed and can rank via title + body. |
| `missing_meta_description` | Affects click-through rate, not indexability; Google frequently rewrites the snippet anyway. |
| `slow_page` | 0.8–3s server-side to return the HTML: real friction, but not a wall. 800ms is roughly Google's "good" TTFB boundary. This is the fetch time of the audit request, not a user-facing performance metric. |
| `images_missing_alt` | Accessibility and image-SEO loss; the page content is still fully consumable. |
| `low_content` | Thin content ranks poorly, but the page still exists and serves its text. |
| `too_many_external_links` | Flagged when a page has at least 5 external links *and* more external than internal ones. A page whose links point mostly off-site isn't guiding visitors deeper into this site — we treat it as a site-architecture / UX signal, not an SEO one (outbound link volume is not a documented Google ranking factor). A minor quality issue. |
| `duplicate_title` | Causes SERP cannibalisation and confusion between pages, real but not fatal. |
| `missing_cta` | A conversion / UX gap, not an SEO one — a missing CTA does not affect indexing. It's a warning because the page still does its "be found and be read" job, and because the crawler can't tell page intent: an informational page (blog post, "about") may legitimately have no CTA, so promoting this to critical would produce false positives. |
| `weak_cta` | Conversion friction — the CTA text is too generic to tell the user what happens on click — but the page still informs. |

The severity of each issue type lives in one place: the `ISSUE_SEVERITY`
map in `server/src/analyzer.ts`.

## Scoring rules and weights


**Per page.** Every page starts at 100. Each issue deducts points by
severity:

| Severity | Points off | Rationale |
| --- | --- | --- |
| `critical` | 20 | A loaded page can realistically hit one or two criticals — no `<title>`, or >3s to return HTML. At −20 each the score drops sharply enough that the page stands out at a glance in the dashboard. |
| `warning` | 8 | Under half a critical, so warnings pile up visibly but a page with a few quality gaps and nothing critical still lands in a "needs work, not broken" band (three warnings → 76). |

The 2.5 : 1 ratio is the point: a critical issue should cost noticeably
more than "a couple of warnings", without making the warning tier
cosmetic. Score is floored at 0.

**Pages that didn't load are scored 0**, not 100 − 20. A page that
returns nothing has no value to a visitor or to search; deducting one
critical and leaving it at 80 would overstate it. (See
`calculatePageScore` in `server/src/scoring.ts`.)

**Overall score** is the plain average of the per-page scores, including
the zeros from failed pages. If two of five crawled pages are down, that
*is* a serious problem and the headline number should show it — weighting
the failures away would hide the finding.

**Known limitation.** Load time is a single measurement with no retry or
median, so a transient network spike from the audit server can push a
page into `slow_page` / `very_slow_page`. With more time we'd take the
median of three fetches.

## AI tools usage

<!-- TODO: be specific and honest — which tools, for which parts, what you
changed. -->

## Known limitations

<!-- TODO -->

## What I'd improve with more time


- **Richer CTA analysis.** Capture each CTA candidate's `href` and tag,
  then add: `broken_cta` (href is `#`, `javascript:…`, or empty — the
  button goes nowhere) and a "no clear primary CTA" check (too many
  competing CTAs on one page dilute the action).
- **Headless browser option.** Run the crawl through Playwright to see
  runtime-injected content, real load performance, and CTA presentation
  (modal vs inline, above/below the fold).
- **Supporting-copy quality**, not just its presence, near each CTA.
- **Fuzzy duplicate-title detection** instead of exact match, to catch
  near-duplicates.
- **Per-issue-type weights** in scoring, so e.g. a missing H1 can weigh
  more than too many external links without adding a third severity tier.
