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
import type { AssetInfo, AssetType, AuditResult } from "@/types/audit";
import { Card } from "@/components/Card";
import { pageLabel } from "@/lib/pageLabel";
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from "@/lib/chartColors";

// The Assets tab: an inventory of images/video/documents found on each page,
// checked with HEAD (or a ranged GET fallback, server/src/assets.ts) but
// never downloaded — so this never feeds the issues/severity/scoring system
// (a HEAD-only, 10-per-page-capped check isn't reliable enough to be an
// "official" SEO finding). The "Heavy" flag below is a local nudge only,
// scoped to this tab. Nothing here is stored or downloadable from us either
// — "download" is just a link back to the asset's own URL.

const TYPE_LABEL: Record<AssetType, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

const TYPE_COLOR: Record<AssetType, string> = {
  image: CATEGORICAL[0],
  video: CATEGORICAL[1],
  document: CATEGORICAL[2],
};

// Flagged locally in this tab only — never fed into issues/scoring (see the
// file header). A single flat number doesn't make sense across types this
// different, so each gets its own "this is worth compressing/hosting
// elsewhere" bar: a photo over 300KB is past what web-perf guides call
// optimized, a directly-embedded video over 10MB should probably be
// streamed/hosted externally instead, and a downloadable document over 5MB
// is still weight a visitor pays for on click, even off the page's own load.
const HEAVY_THRESHOLD_BYTES: Record<AssetType, number> = {
  image: 300 * 1024,
  video: 10 * 1024 * 1024,
  document: 5 * 1024 * 1024,
};

function isHeavy(asset: AssetInfo): boolean {
  return (
    asset.bytes !== null && asset.bytes > HEAVY_THRESHOLD_BYTES[asset.type]
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Largest first — that's the point of a weight audit. Assets we couldn't
// size (null bytes) sort last, not first.
function bySizeDescending(a: AssetInfo, b: AssetInfo): number {
  return (b.bytes ?? -1) - (a.bytes ?? -1);
}

function assetName(url: string): string {
  try {
    const { pathname } = new URL(url);
    const last = pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p
        className={`text-2xl font-semibold ${warn ? "text-amber-700" : "text-neutral-900"}`}
      >
        {value}
      </p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

export function AssetsView({ result }: { result: AuditResult }) {
  const rows = result.pages.flatMap((p) =>
    p.assets.map((a) => ({ ...a, pageUrl: p.page.url })),
  );

  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-sm text-neutral-500">
          No image, video or document assets found (up to 10 per page are
          checked — see the README).
        </p>
      </Card>
    );
  }

  const byType: Record<AssetType, number> = { image: 0, video: 0, document: 0 };
  const bytesByType: Record<AssetType, number> = {
    image: 0,
    video: 0,
    document: 0,
  };
  for (const a of rows) {
    byType[a.type]++;
    bytesByType[a.type] += a.bytes ?? 0;
  }
  const totalBytes =
    bytesByType.image + bytesByType.video + bytesByType.document;
  const knownCount = rows.filter((a) => a.bytes !== null).length;
  const heavyCount = rows.filter(isHeavy).length;

  const weightByPage = result.pages
    .filter((p) => p.assets.length > 0)
    .map((p) => ({
      name: pageLabel(p.page.url),
      image:
        p.assets
          .filter((a) => a.type === "image")
          .reduce((s, a) => s + (a.bytes ?? 0), 0) / 1024,
      video:
        p.assets
          .filter((a) => a.type === "video")
          .reduce((s, a) => s + (a.bytes ?? 0), 0) / 1024,
      document:
        p.assets
          .filter((a) => a.type === "document")
          .reduce((s, a) => s + (a.bytes ?? 0), 0) / 1024,
    }));

  const countByType = (["image", "video", "document"] as AssetType[])
    .map((type) => ({
      name: TYPE_LABEL[type],
      count: byType[type],
      color: TYPE_COLOR[type],
    }))
    .filter((d) => d.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Assets found" value={rows.length} />
        <Stat label="Images" value={byType.image} />
        <Stat label="Videos" value={byType.video} />
        <Stat label="Documents" value={byType.document} />
        <Stat label="Heavy assets" value={heavyCount} warn={heavyCount > 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={`Total weight (${knownCount}/${rows.length} sized)`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weightByPage}>
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
              <YAxis tick={{ fill: CHART_AXIS, fontSize: 12 }} unit="KB" />
              <Tooltip
                formatter={(value) => `${Number(value).toFixed(0)} KB`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="image"
                name="images"
                stackId="w"
                fill={TYPE_COLOR.image}
              />
              <Bar
                dataKey="video"
                name="video"
                stackId="w"
                fill={TYPE_COLOR.video}
              />
              <Bar
                dataKey="document"
                name="documents"
                stackId="w"
                fill={TYPE_COLOR.document}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-neutral-500">
            Known weight only ({formatBytes(totalBytes)} total) — assets we
            couldn&apos;t size (timed out, blocked, or the server didn&apos;t
            report a size) aren&apos;t counted here.
          </p>
        </Card>

        <Card title="Assets by type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={countByType}>
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: CHART_AXIS, fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {countByType.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {result.pages.map(
        (p) =>
          p.assets.length > 0 && (
            <Card key={p.page.url} title={pageLabel(p.page.url)} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th scope="col" className="p-3 font-medium">
                        Name
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        Type
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        Content type
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        Size
                      </th>
                      <th scope="col" className="p-3 font-medium">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[...p.assets]
                      .sort(bySizeDescending)
                      .map((a: AssetInfo) => (
                        <tr key={a.url}>
                          <td className="max-w-xs truncate p-3">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                              title={a.url}
                            >
                              {assetName(a.url)}
                            </a>
                          </td>
                          <td className="p-3 text-neutral-600">
                            {TYPE_LABEL[a.type]}
                          </td>
                          <td className="p-3 text-neutral-600">
                            {a.contentType ?? "—"}
                          </td>
                          <td className="p-3 text-neutral-600">
                            {a.ok ? formatBytes(a.bytes) : "—"}
                            {isHeavy(a) && (
                              <span className="ml-1.5 rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                Heavy
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-neutral-600">
                            {a.ok ? `${a.fetchMs} ms` : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ),
      )}
    </div>
  );
}
