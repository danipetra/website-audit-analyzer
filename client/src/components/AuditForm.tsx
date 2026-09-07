"use client";

import { useRef, useState } from "react";

export function AuditForm({
  onRunAudit,
  onLoadSample,
  onImportFile,
  loading,
}: {
  onRunAudit: (url: string) => void;
  onLoadSample: () => void;
  onImportFile: (file: File) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onRunAudit(url.trim());
        }}
      >
        <input
          type="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Running audit..." : "Run audit"}
        </button>
      </form>

      <div className="mt-3 flex items-center gap-3 text-sm text-neutral-500">
        <button type="button" onClick={onLoadSample} className="underline hover:text-neutral-800">
          Load sample data
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="underline hover:text-neutral-800"
        >
          Import JSON file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
