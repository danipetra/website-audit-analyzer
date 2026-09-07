"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AuditResult } from "@/types/audit";
import { pageLabel } from "@/lib/pageLabel";
import { CATEGORICAL, CHART_AXIS, CHART_GRID, SEQUENTIAL_BLUE, STATUS } from "@/lib/chartColors";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartsGrid({ result }: { result: AuditResult }) {
  const pages = result.pages;

  const scoreByPage = pages.map((p) => ({ name: pageLabel(p.page.url), score: p.score }));

  const loadTimeByPage = pages
    .filter((p) => p.page.fetchOutcome === "ok")
    .map((p) => ({ name: pageLabel(p.page.url), loadTimeMs: p.page.loadTimeMs }));

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
    { name: "http error", count: outcomeCounts.http_error, color: STATUS.serious },
    { name: "timeout", count: outcomeCounts.timeout, color: STATUS.critical },
    { name: "network error", count: outcomeCounts.network_error, color: STATUS.critical },
  ].filter((d) => d.count > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Score by page">
        <BarChart data={scoreByPage}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Load time by page (successful pages)">
        <BarChart data={loadTimeByPage}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <YAxis tick={{ fill: CHART_AXIS, fontSize: 12 }} unit="ms" />
          <Tooltip />
          <Bar dataKey="loadTimeMs" fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Issue distribution by type">
        <BarChart data={issueDistribution} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke={CHART_GRID} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Missing elements by page">
        <BarChart data={missingByPage}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="missing title" fill={CATEGORICAL[0]} />
          <Bar dataKey="missing meta" fill={CATEGORICAL[1]} />
          <Bar dataKey="missing h1" fill={CATEGORICAL[2]} />
          <Bar dataKey="images missing alt" fill={CATEGORICAL[3]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Status / fetch outcome distribution">
        <BarChart data={statusDistribution}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS, fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {statusDistribution.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>
    </div>
  );
}
