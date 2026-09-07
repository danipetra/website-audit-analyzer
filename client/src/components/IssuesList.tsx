import type { AuditResult } from "@/types/audit";
import { SEVERITY_BADGE_CLASS, SEVERITY_LABEL } from "@/lib/severity";
import { pageLabel } from "@/lib/pageLabel";

export function IssuesList({ result }: { result: AuditResult }) {
  const rows = result.pages
    .flatMap((p) => p.issues)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
        No issues detected.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <ul className="divide-y divide-neutral-100">
        {rows.map((issue, i) => (
          <li key={`${issue.pageUrl}-${issue.type}-${i}`} className="flex items-start gap-3 p-3">
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASS[issue.severity]}`}
            >
              {SEVERITY_LABEL[issue.severity]}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-neutral-800">{issue.message}</p>
              <p className="truncate text-xs text-neutral-500">{pageLabel(issue.pageUrl)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
