// Plant search, zone matching, placement (right panel).
// STUB — slides in from the right when the plant tool is active; the map stays
// visible on the left (CLAUDE.md §Plant Panel, DESIGN.md §Plant Recommendations).
export function PlantPanel() {
  return (
    <aside className="pointer-events-auto absolute right-3.5 top-1/2 z-40 flex h-[min(80vh,640px)] w-[420px] -translate-y-1/2 flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-solar">
      <h2 className="font-display text-lg font-bold text-on-surface">
        Plant database
      </h2>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Zone-aware plant matches (Ideal / OK / Poor) and click-to-place go here.
      </p>
    </aside>
  )
}
