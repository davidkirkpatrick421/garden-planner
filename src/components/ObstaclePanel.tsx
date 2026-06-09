// Add obstacle or garden feature (bottom-right).
// STUB — shares the bottom-right slot with ZonePanel; only one shows at a time
// based on the active tool (CLAUDE.md §UI/UX Decisions).
export function ObstaclePanel() {
  return (
    <aside className="pointer-events-auto absolute bottom-3.5 right-3.5 z-40 w-80 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-solar">
      <h2 className="font-display text-base font-bold text-on-surface">
        Obstacles &amp; features
      </h2>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Add fences, hedges, sheds (shade-casting) or beds, patios, ponds
        (features). Height drives the shadow calculation.
      </p>
    </aside>
  )
}
