"use client";

import { useState } from "react";
import { AuditForm } from "@/components/AuditForm";
import { Dashboard } from "@/components/Dashboard";
import { isAuditResult } from "@/lib/validateAuditResult";
import type { AuditResult } from "@/types/audit";

export default function Home() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunAudit(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Audit failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSample() {
    setError(null);
    const res = await fetch("/sample-audit.json");
    const data = await res.json();
    setResult(data);
  }

  async function handleImportFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!isAuditResult(data)) throw new Error("File doesn't match the expected audit shape");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file");
    }
  }

  return (
    <div className="min-h-full bg-neutral-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Website Audit Collector &amp; Analyzer
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter a public website URL to crawl and audit it, or load sample data.
          </p>
        </div>

        <AuditForm
          onRunAudit={handleRunAudit}
          onLoadSample={handleLoadSample}
          onImportFile={handleImportFile}
          loading={loading}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {result && <Dashboard result={result} />}
      </main>
    </div>
  );
}
