import type { AuditResult } from "@/types/audit";
import { SummaryCards } from "@/components/SummaryCards";
import { ChartsGrid } from "@/components/Charts";
import { IssuesList } from "@/components/IssuesList";
import { RawDataView } from "@/components/RawDataView";

export function Dashboard({ result }: { result: AuditResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">Audit for</p>
        <p className="text-lg font-medium text-neutral-900">{result.requestedUrl}</p>
      </div>

      <SummaryCards summary={result.summary} />
      <ChartsGrid result={result} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Issues</h2>
        <IssuesList result={result} />
      </div>

      <RawDataView result={result} />
    </div>
  );
}
