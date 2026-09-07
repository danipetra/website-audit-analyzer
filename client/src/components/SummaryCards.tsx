import type { AuditSummary } from "@/types/audit";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: AuditSummary }) {
  const cards: { label: string; value: string | number }[] = [
    { label: "Overall score", value: `${summary.overallScore}/100` },
    { label: "Pages checked", value: summary.totalPages },
    { label: "Successful pages", value: summary.successfulPages },
    { label: "Failed pages", value: summary.failedPages },
    { label: "Critical issues", value: summary.criticalIssues },
    { label: "Warnings", value: summary.warnings },
    { label: "Avg. load time", value: `${summary.averageLoadTimeMs}ms` },
    { label: "Missing title", value: summary.pagesMissingTitle },
    { label: "Missing meta description", value: summary.pagesMissingMetaDescription },
    { label: "Missing H1", value: summary.pagesMissingH1 },
    { label: "Images missing alt", value: summary.totalImagesMissingAlt },
    { label: "CTAs detected", value: summary.detectedCtaCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} {...card} />
      ))}
    </div>
  );
}
