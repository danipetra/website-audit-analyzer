import type { AuditResult } from "@/types/audit";
import { Card } from "@/components/Card";
import { SCORE_BAND_LABEL, SCORE_BAND_TEXT_CLASS } from "@/lib/severity";
import { STATUS } from "@/lib/chartColors";

// The Overview tab's sidebar. These facts used to each be a full ChartCard
// (a single-number donut) or a standalone tile grid — a lone number or a
// two-way split doesn't need a chart's worth of space, so they live here as
// compact rows instead, next to the score-band legend.

function GapRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-neutral-600">{label}</span>
      <span
        className={`font-semibold tabular-nums ${warn ? "text-amber-700" : "text-neutral-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SplitBar({
  label,
  segments,
}: {
  label: string;
  segments: { value: number; color: string; name: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="py-1.5">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="shrink-0 text-xs text-neutral-500">
          {segments.map((s) => `${s.value} ${s.name}`).join(" / ")}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-neutral-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.name}
                style={{
                  width: `${(s.value / total) * 100}%`,
                  backgroundColor: s.color,
                }}
              />
            ))}
      </div>
    </div>
  );
}

export function OverviewRail({ result }: { result: AuditResult }) {
  const { pages, summary } = result;

  const withCriticals = pages.filter((p) =>
    p.issues.some((i) => i.severity === "critical"),
  ).length;
  const redirectedCount = pages.filter((p) => p.page.redirected).length;
  const strongCtaCount = Math.max(
    0,
    summary.detectedCtaCount - summary.weakCtaCount,
  );

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-6">
      <Card title="Content & SEO gaps">
        <div className="flex flex-col divide-y divide-neutral-100">
          <GapRow
            label="Missing title"
            value={summary.pagesMissingTitle}
            warn={summary.pagesMissingTitle > 0}
          />
          <GapRow
            label="Missing meta description"
            value={summary.pagesMissingMetaDescription}
            warn={summary.pagesMissingMetaDescription > 0}
          />
          <GapRow
            label="Missing H1"
            value={summary.pagesMissingH1}
            warn={summary.pagesMissingH1 > 0}
          />
          <GapRow
            label="Images missing alt"
            value={summary.totalImagesMissingAlt}
            warn={summary.totalImagesMissingAlt > 0}
          />
          <GapRow
            label="CTAs detected"
            value={summary.detectedCtaCount}
            warn={false}
          />
        </div>
      </Card>

      <Card title="Site health">
        <div className="flex flex-col divide-y divide-neutral-100">
          <SplitBar
            label="Critical errors"
            segments={[
              {
                value: pages.length - withCriticals,
                color: STATUS.good,
                name: "clean",
              },
              {
                value: withCriticals,
                color: STATUS.critical,
                name: "with critical",
              },
            ]}
          />
          <SplitBar
            label="Redirected"
            segments={[
              {
                value: pages.length - redirectedCount,
                color: STATUS.good,
                name: "direct",
              },
              {
                value: redirectedCount,
                color: STATUS.warning,
                name: "redirected",
              },
            ]}
          />
          <SplitBar
            label="CTA quality"
            segments={[
              { value: strongCtaCount, color: STATUS.good, name: "strong" },
              {
                value: summary.weakCtaCount,
                color: STATUS.warning,
                name: "weak",
              },
            ]}
          />
        </div>
      </Card>

      <Card title="Score bands">
        <ul className="flex flex-col gap-1.5 text-sm">
          <li className="flex items-center justify-between">
            <span className={`font-medium ${SCORE_BAND_TEXT_CLASS.good}`}>
              {SCORE_BAND_LABEL.good}
            </span>
            <span className="text-neutral-500">&ge; 80</span>
          </li>
          <li className="flex items-center justify-between">
            <span className={`font-medium ${SCORE_BAND_TEXT_CLASS.warning}`}>
              {SCORE_BAND_LABEL.warning}
            </span>
            <span className="text-neutral-500">50&ndash;79</span>
          </li>
          <li className="flex items-center justify-between">
            <span className={`font-medium ${SCORE_BAND_TEXT_CLASS.poor}`}>
              {SCORE_BAND_LABEL.poor}
            </span>
            <span className="text-neutral-500">&lt; 50</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
