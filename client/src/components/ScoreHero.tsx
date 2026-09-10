import type { AuditSummary } from "@/types/audit";
import { SCORE_BAND_LABEL, SCORE_BAND_TEXT_CLASS, scoreBand } from "@/lib/severity";

// The headline of the Overview tab: the overall score, its band, and the
// two tallies that give it context (pages, issues).

function Stat({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div>
      <p className={`text-xl font-semibold text-neutral-900 ${className}`}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export function ScoreHero({ summary }: { summary: AuditSummary }) {
  const band = scoreBand(summary.overallScore);

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-bold tabular-nums ${SCORE_BAND_TEXT_CLASS[band]}`}>
            {summary.overallScore}
          </span>
          <span className="text-lg text-neutral-400">/ 100</span>
          <span className={`ml-1 text-sm font-medium ${SCORE_BAND_TEXT_CLASS[band]}`}>
            {SCORE_BAND_LABEL[band]}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Stat value={summary.totalPages} label="pages checked" />
          <Stat value={summary.successfulPages} label="successful" />
          <Stat
            value={summary.failedPages}
            label="failed"
            className={summary.failedPages > 0 ? "text-red-700" : ""}
          />
          <Stat
            value={summary.criticalIssues}
            label="critical issues"
            className={summary.criticalIssues > 0 ? "text-red-700" : ""}
          />
          <Stat
            value={summary.warnings}
            label="warnings"
            className={summary.warnings > 0 ? "text-amber-700" : ""}
          />
          <Stat value={`${summary.averageLoadTimeMs} ms`} label="avg. load time" />
        </div>
      </div>
    </section>
  );
}
