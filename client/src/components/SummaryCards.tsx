import type { AuditSummary } from "@/types/audit";

// Detail tiles that complement the ScoreHero — the "what's actually missing"
// numbers. Score / page / issue tallies live in the hero, not here.

function Tile({ label, value, warn }: { label: string; value: number; warn: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn ? "text-amber-700" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: AuditSummary }) {
  const tiles = [
    { label: "Pages missing title", value: summary.pagesMissingTitle },
    { label: "Pages missing meta description", value: summary.pagesMissingMetaDescription },
    { label: "Pages missing H1", value: summary.pagesMissingH1 },
    { label: "Images missing alt", value: summary.totalImagesMissingAlt },
    { label: "CTAs detected", value: summary.detectedCtaCount },
  ];

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Content &amp; SEO gaps
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Tile
            key={t.label}
            label={t.label}
            value={t.value}
            warn={t.label !== "CTAs detected" && t.value > 0}
          />
        ))}
      </div>
    </div>
  );
}
