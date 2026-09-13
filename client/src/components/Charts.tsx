"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AuditResult } from "@/types/audit";
import { Card } from "@/components/Card";
import { pageLabel } from "@/lib/pageLabel";
import {
  CATEGORICAL,
  CHART_AXIS,
  CHART_GRID,
  SEQUENTIAL_BLUE,
  STATUS,
} from "@/lib/chartColors";

// Thresholds mirrored from server/src/analyzer.ts THRESHOLDS, shown as
// reference lines so a single bar can be read against the benchmark.
const SLOW_PAGE_WARN_MS = 800;
const SLOW_PAGE_CRITICAL_MS = 3000;
const MIN_WORD_COUNT = 150;

function ChartCard({
  title,
  height = 260,
  children,
}: {
  title: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </Card>
  );
}

// Native <details>/<summary> — expandable without any extra state, and
// keyboard/screen-reader behavior comes for free. Open by default so the
// first view is unchanged; collapsing is an option, not the default.
function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open
      className="group rounded-lg border border-neutral-200 bg-white"
    >
      <summary className="flex list-none cursor-pointer items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="mt-1 h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-90"
        >
          <path
            d="M7 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 p-4 lg:grid-cols-2">
        {children}
      </div>
    </details>
  );
}

export function ChartsGrid({ result }: { result: AuditResult }) {
  const pages = result.pages;

  const scoreByPage = pages.map((p) => ({
    name: pageLabel(p.page.url),
    score: p.score,
  }));

  const loadTimeByPage = pages
    .filter((p) => p.page.fetchOutcome === "ok")
    .map((p) => ({
      name: pageLabel(p.page.url),
      serverResponseMs: p.page.serverResponseMs,
      htmlDownloadMs: p.page.htmlDownloadMs,
    }));

  const issueCounts = new Map<string, number>();
  for (const p of pages) {
    for (const issue of p.issues) {
      issueCounts.set(issue.type, (issueCounts.get(issue.type) ?? 0) + 1);
    }
  }
  const issueDistribution = [...issueCounts.entries()]
    .map(([type, count]) => ({ name: type.replace(/_/g, " "), count }))
    .sort((a, b) => b.count - a.count);

  const missingByPage = pages.map((p) => ({
    name: pageLabel(p.page.url),
    "missing title": p.page.title ? 0 : 1,
    "missing meta": p.page.metaDescription ? 0 : 1,
    "missing h1": p.page.h1 ? 0 : 1,
    "images missing alt": p.page.imagesMissingAlt,
  }));

  const outcomeCounts = { ok: 0, http_error: 0, timeout: 0, network_error: 0 };
  for (const p of pages) outcomeCounts[p.page.fetchOutcome]++;
  const statusDistribution = [
    { name: "ok", count: outcomeCounts.ok, color: STATUS.good },
    {
      name: "http error",
      count: outcomeCounts.http_error,
      color: STATUS.serious,
    },
    { name: "timeout", count: outcomeCounts.timeout, color: STATUS.critical },
    {
      name: "network error",
      count: outcomeCounts.network_error,
      color: STATUS.critical,
    },
  ].filter((d) => d.count > 0);

  // Raw HTTP status codes, distinct from the fetch-outcome bucket above —
  // e.g. two "ok" pages can be a 200 and a 301 that was followed.
  function statusCodeColor(code: number | null): string {
    if (code === null) return STATUS.critical;
    if (code >= 500) return STATUS.critical;
    if (code >= 400) return STATUS.critical;
    if (code >= 300) return STATUS.warning;
    return STATUS.good;
  }
  const statusCodeCounts = new Map<string, { count: number; color: string }>();
  for (const p of pages) {
    const code = p.page.statusCode;
    const key = code === null ? "no response" : String(code);
    const existing = statusCodeCounts.get(key);
    statusCodeCounts.set(key, {
      count: (existing?.count ?? 0) + 1,
      color: statusCodeColor(code),
    });
  }
  const statusCodeDistribution = [...statusCodeCounts.entries()]
    .map(([name, { count, color }]) => ({ name, count, color }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const linksByPage = pages
    .filter((p) => p.page.fetchOutcome === "ok")
    .map((p) => ({
      name: pageLabel(p.page.url),
      internal: p.page.internalLinksCount,
      external: p.page.externalLinksCount,
    }));

  const wordCountByPage = pages
    .filter((p) => p.page.fetchOutcome === "ok")
    .map((p) => ({ name: pageLabel(p.page.url), wordCount: p.page.wordCount }));

  const h2CountByPage = pages
    .filter((p) => p.page.fetchOutcome === "ok")
    .map((p) => ({ name: pageLabel(p.page.url), h2Count: p.page.h2Count }));

  return (
    <div className="flex flex-col gap-8">
      <ChartSection
        title="Availability & performance"
        description="Can every page be reached, and how fast does the server return its HTML."
      >
        <ChartCard title="Score by page">
          <BarChart data={scoreByPage} margin={{ top: 16 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="score" fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="score"
                position="top"
                fill={CHART_AXIS}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Load time by page — server response vs HTML download">
          <BarChart data={loadTimeByPage} margin={{ top: 16 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis tick={{ fill: CHART_AXIS, fontSize: 12 }} unit="ms" />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine
              y={SLOW_PAGE_WARN_MS}
              stroke={STATUS.warning}
              strokeDasharray="4 4"
              label={{
                value: `warn ${SLOW_PAGE_WARN_MS}ms`,
                position: "insideTopLeft",
                fill: CHART_AXIS,
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={SLOW_PAGE_CRITICAL_MS}
              stroke={STATUS.critical}
              strokeDasharray="4 4"
              label={{
                value: `critical ${SLOW_PAGE_CRITICAL_MS}ms`,
                position: "insideBottomRight",
                fill: CHART_AXIS,
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="serverResponseMs"
              name="server response"
              stackId="load"
              fill={CATEGORICAL[0]}
            />
            <Bar
              dataKey="htmlDownloadMs"
              name="HTML download"
              stackId="load"
              fill={CATEGORICAL[1]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard title="HTTP status codes">
          <BarChart data={statusCodeDistribution}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {statusCodeDistribution.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Status / fetch outcome distribution">
          <BarChart data={statusDistribution}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {statusDistribution.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </ChartSection>

      <ChartSection
        title="Content, SEO & links"
        description="What's on each page once it loads, and where it points."
      >
        <ChartCard title="Issue distribution by type">
          <BarChart
            data={issueDistribution}
            layout="vertical"
            margin={{ left: 8 }}
          >
            <CartesianGrid stroke={CHART_GRID} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                fill={CHART_AXIS}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Missing elements by page">
          <BarChart data={missingByPage}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="missing title" fill={CATEGORICAL[0]} />
            <Bar dataKey="missing meta" fill={CATEGORICAL[1]} />
            <Bar dataKey="missing h1" fill={CATEGORICAL[2]} />
            <Bar dataKey="images missing alt" fill={CATEGORICAL[3]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Word count by page">
          <BarChart data={wordCountByPage} margin={{ top: 16 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <Tooltip />
            <ReferenceLine
              y={MIN_WORD_COUNT}
              stroke={STATUS.warning}
              strokeDasharray="4 4"
              label={{
                value: `low content < ${MIN_WORD_COUNT}`,
                position: "insideTopLeft",
                fill: CHART_AXIS,
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="wordCount"
              fill={SEQUENTIAL_BLUE}
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="wordCount"
                position="top"
                fill={CHART_AXIS}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="H2 count by page">
          <BarChart data={h2CountByPage}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Bar
              dataKey="h2Count"
              fill={SEQUENTIAL_BLUE}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard title="Internal vs external links by page">
          <BarChart data={linksByPage}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_AXIS, fontSize: 12 }}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="internal"
              name="internal"
              fill={CATEGORICAL[0]}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="external"
              name="external"
              fill={CATEGORICAL[1]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartCard>
      </ChartSection>
    </div>
  );
}
