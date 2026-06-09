// Floating sun-hours summary (bottom-left).
// STUB — DESIGN.md §Garden Analysis left card (stat list + insight pill + CTA).
export function ResultsCard() {
  return (
    <aside className="texture-overlay pointer-events-auto absolute bottom-3.5 left-3.5 z-40 w-80 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-solar">
      <h2 className="font-display text-base font-bold text-on-surface">
        Sun hours
      </h2>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Per-zone daily totals appear here once a boundary is drawn.
      </p>
    </aside>
  )
}
