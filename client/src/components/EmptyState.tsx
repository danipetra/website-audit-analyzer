// Shown before any audit result exists — the first thing a visitor sees.
// Explains the *method* (how the crawl works, what it checks) rather than
// previewing the dashboard's shape — that would just repeat a minute later
// once real results replace it.
//
// Both are user-facing restatements of real behavior, not just copy:
// SCAN_SUMMARY mirrors server/src/config.ts (FETCH_TIMEOUT_MS,
// MAX_INTERNAL_PAGES) and CHECKS mirrors the issue types in
// server/src/analyzer.ts (ISSUE_SEVERITY). Changing either of those means
// updating this file too, or the empty state starts lying about the tool.
//
// Stacked as one centered column rather than two side-by-side lists —
// a 3-line paragraph next to a 9-item list never balances, whatever their
// internal alignment, since their heights and text density can't match.

const SCAN_SUMMARY =
  "Homepage + up to 4 internal pages linked from it, fetched in parallel. " +
  "8-second timeout per page — a failed or slow page still gets scored, not skipped.";

const CHECKS = [
  "Title & meta description",
  "H1",
  "CTA quality",
  "Load time",
  "Images without alt",
  "Internal / external links",
  "Word count",
  "Duplicate titles",
  "HTTP status & redirects",
];

export function EmptyState({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-neutral-300 px-6 py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        <p className="font-display text-lg font-semibold text-neutral-900">
          Crawling the site…
        </p>
        <p className="text-sm text-neutral-500">
          Homepage first, then up to 4 internal pages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/30 text-accent">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path
            d="M12 3a9 9 0 1 0 9 9 M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-neutral-900">
          Ready when you are
        </h2>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Enter a URL above, or load the sample data to preview the dashboard
          first.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          How it scans
        </h3>
        <p className="mx-auto mt-2 text-sm text-neutral-600">{SCAN_SUMMARY}</p>
      </div>

      <div className="w-full max-w-lg">
        <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          What it checks
        </h3>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {CHECKS.map((check) => (
            <span
              key={check}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600"
            >
              {check}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
