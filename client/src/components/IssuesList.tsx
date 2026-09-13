import type { AuditResult, Issue, Severity } from "@/types/audit";
import { Card } from "@/components/Card";
import { SEVERITY_BADGE_CLASS, SEVERITY_LABEL } from "@/lib/severity";
import { pageLabel } from "@/lib/pageLabel";

const ORDER: Severity[] = ["critical", "warning"];

export function IssuesList({ result }: { result: AuditResult }) {
  const all = result.pages.flatMap((p) => p.issues);

  if (all.length === 0) {
    return (
      <Card>
        <p className="text-sm text-neutral-500">No issues detected.</p>
      </Card>
    );
  }

  const groups = ORDER.map((severity) => ({
    severity,
    issues: all.filter((i) => i.severity === severity),
  })).filter((g) => g.issues.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <Card
          key={group.severity}
          padded={false}
          title={
            <span className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASS[group.severity]}`}
              >
                {SEVERITY_LABEL[group.severity]}
              </span>
              <span className="text-neutral-400">{group.issues.length}</span>
            </span>
          }
        >
          <ul className="divide-y divide-neutral-100">
            {group.issues.map((issue: Issue, i) => (
              <li
                key={`${issue.pageUrl}-${issue.type}-${i}`}
                className="flex items-start gap-3 p-3"
              >
                <code className="mt-0.5 shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                  {issue.type}
                </code>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800">{issue.message}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {pageLabel(issue.pageUrl)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
