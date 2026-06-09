// Left-side vertical tool buttons: Boundary, Zones, Obstacles, Plants.
// STUB — tools 2–4 are disabled until a boundary exists (CLAUDE.md §UI/UX).
const TOOLS = [
  { key: 'boundary', icon: 'polyline', label: 'Boundary' },
  { key: 'zones', icon: 'category', label: 'Zones' },
  { key: 'obstacles', icon: 'architecture', label: 'Obstacles' },
  { key: 'plants', icon: 'local_florist', label: 'Plants' },
] as const

export function ToolStrip() {
  return (
    <nav className="pointer-events-auto absolute left-3.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 rounded-xl border border-outline-variant/20 bg-surface/90 p-1 shadow-sm backdrop-blur-md">
      {TOOLS.map((tool) => (
        <button
          key={tool.key}
          type="button"
          title={tool.label}
          className="grid h-10 w-10 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant/50"
        >
          <span className="material-symbols-outlined text-[20px]">
            {tool.icon}
          </span>
        </button>
      ))}
    </nav>
  )
}
