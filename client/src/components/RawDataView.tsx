import type { AuditResult } from "@/types/audit";

export function RawDataView({ result }: { result: AuditResult }) {
  return (
    <details className="rounded-lg border border-neutral-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-medium text-neutral-700">
        Raw normalized data (JSON)
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  );
}
