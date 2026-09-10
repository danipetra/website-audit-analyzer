"use client";

import { useState } from "react";
import type { AuditResult } from "@/types/audit";
import { ScoreHero } from "@/components/ScoreHero";
import { SummaryCards } from "@/components/SummaryCards";
import { ChartsGrid } from "@/components/Charts";
import { IssuesList } from "@/components/IssuesList";
import { PagesTable } from "@/components/PagesTable";
import { RawDataView } from "@/components/RawDataView";

const TABS = ["Overview", "Inspected pages", "Errors", "Raw data"] as const;
type Tab = (typeof TABS)[number];

export function Dashboard({ result }: { result: AuditResult }) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">Audit for</p>
        <p className="text-lg font-medium text-neutral-900">{result.requestedUrl}</p>
      </div>

      <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`-mb-px rounded-t border-b-2 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                active
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && (
        <div className="flex flex-col gap-6">
          <ScoreHero summary={result.summary} />
          <SummaryCards summary={result.summary} />
          <ChartsGrid result={result} />
        </div>
      )}

      {tab === "Inspected pages" && <PagesTable result={result} />}

      {tab === "Errors" && <IssuesList result={result} />}

      {tab === "Raw data" && <RawDataView result={result} />}
    </div>
  );
}
