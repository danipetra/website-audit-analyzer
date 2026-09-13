import type { ReactNode } from "react";

// One shared surface for the whole dashboard — panels, chart cards, tables.
// Keeps border/radius/background/spacing in a single place.

export function Card({
  title,
  action,
  padded = true,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      {title && (
        <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
          {action}
        </header>
      )}
      <div className={padded ? "p-4" : undefined}>{children}</div>
    </section>
  );
}
