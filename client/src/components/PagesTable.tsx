"use client";

import { Fragment, useState } from "react";
import type { AuditResult, PageAuditResult } from "@/types/audit";
import { SEVERITY_BADGE_CLASS, SEVERITY_LABEL } from "@/lib/severity";
import { pageLabel } from "@/lib/pageLabel";

// Crawled-page inventory with an expandable per-page detail row. Scaffold:
// wired to the real data, layout/hierarchy still to refine.

function outcomeText(p: PageAuditResult): string {
  const { fetchOutcome, statusCode } = p.page;
  if (fetchOutcome === "ok") return statusCode ? `OK ${statusCode}` : "OK";
  if (fetchOutcome === "http_error") return `HTTP ${statusCode ?? "?"}`;
  return fetchOutcome;
}

function PageDetail({ result }: { result: PageAuditResult }) {
  const p = result.page;
  const metrics: [string, string | number][] = [
    ["Final URL", p.finalUrl],
    ["Redirected", p.redirected ? "yes" : "no"],
    ["Load time", `${p.loadTimeMs} ms`],
    ["Word count", p.wordCount],
    ["Title", p.title ?? "—"],
    ["Meta description", p.metaDescription ?? "—"],
    ["H1", p.h1 ?? "—"],
    ["H2 count", p.h2Count],
    ["Images", `${p.imageCount} (${p.imagesMissingAlt} missing alt)`],
    ["Links", `${p.internalLinksCount} internal / ${p.externalLinksCount} external`],
    ["CTA texts", p.ctaTexts.length ? p.ctaTexts.join(", ") : "—"],
  ];

  return (
    <div className="grid gap-4 bg-neutral-50 p-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Metrics</p>
        <dl className="space-y-1 text-sm">
          {metrics.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-36 shrink-0 text-neutral-500">{label}</dt>
              <dd className="min-w-0 truncate text-neutral-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Issues ({result.issues.length})
        </p>
        {result.issues.length === 0 ? (
          <p className="text-sm text-neutral-500">None.</p>
        ) : (
          <ul className="space-y-1.5">
            {result.issues.map((issue, i) => (
              <li key={`${issue.type}-${i}`} className="flex items-start gap-2 text-sm">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASS[issue.severity]}`}
                >
                  {SEVERITY_LABEL[issue.severity]}
                </span>
                <span className="text-neutral-800">{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PagesTable({ result }: { result: AuditResult }) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th scope="col" className="p-3 font-medium">Page</th>
            <th scope="col" className="p-3 font-medium">Status</th>
            <th scope="col" className="p-3 font-medium">Load</th>
            <th scope="col" className="p-3 font-medium">Words</th>
            <th scope="col" className="p-3 font-medium">Score</th>
            <th scope="col" className="p-3 font-medium">Issues</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {result.pages.map((p) => {
            const isOpen = openUrl === p.page.url;
            return (
              <Fragment key={p.page.url}>
                <tr
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => setOpenUrl(isOpen ? null : p.page.url)}
                >
                  <td className="p-3">
                    <span className="text-neutral-400">{isOpen ? "▾ " : "▸ "}</span>
                    {pageLabel(p.page.url)}
                  </td>
                  <td className="p-3 text-neutral-600">{outcomeText(p)}</td>
                  <td className="p-3 text-neutral-600">
                    {p.page.fetchOutcome === "ok" ? `${p.page.loadTimeMs} ms` : "—"}
                  </td>
                  <td className="p-3 text-neutral-600">
                    {p.page.fetchOutcome === "ok" ? p.page.wordCount : "—"}
                  </td>
                  <td className="p-3 font-medium text-neutral-900">{p.score}</td>
                  <td className="p-3 text-neutral-600">{p.issues.length}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <PageDetail result={p} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
