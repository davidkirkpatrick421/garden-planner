// Draw and configure sub-zones (bottom-right).
// STUB — shares the bottom-right slot with ObstaclePanel (CLAUDE.md §UI/UX).
export function ZonePanel() {
  return (
    <aside className="pointer-events-auto absolute bottom-3.5 right-3.5 z-40 w-80 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-solar">
      <h2 className="font-display text-base font-bold text-on-surface">Zones</h2>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Draw raised beds, open beds, patios, lawn, greenhouse, or pond. Each
        zone gets its own sun-hours total.
      </p>
    </aside>
  )
}
