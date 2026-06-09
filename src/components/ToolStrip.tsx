// Left-side vertical tool buttons.
// Tool order per CLAUDE.md: Boundary → Zones → Obstacles → Plants.
// Tools 2–4 are disabled until a boundary exists.
type ActiveTool = 'boundary' | 'zones' | 'obstacles' | 'plants' | null

interface ToolStripProps {
  activeTool: ActiveTool
  hasBoundary: boolean
  isDrawing: boolean
  onToolSelect: (tool: ActiveTool) => void
  onUndoLastPoint: () => void
}

const TOOLS: { key: ActiveTool; icon: string; label: string; requiresBoundary: boolean }[] = [
  { key: 'boundary', icon: 'polyline',       label: 'Draw boundary',  requiresBoundary: false },
  { key: 'zones',    icon: 'category',       label: 'Draw zones',     requiresBoundary: true  },
  { key: 'obstacles',icon: 'architecture',   label: 'Add obstacles',  requiresBoundary: true  },
  { key: 'plants',   icon: 'local_florist',  label: 'Place plants',   requiresBoundary: true  },
]

export function ToolStrip({
  activeTool,
  hasBoundary,
  isDrawing,
  onToolSelect,
  onUndoLastPoint,
}: ToolStripProps) {
  return (
    <nav className="pointer-events-auto absolute left-3.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-outline-variant/20 bg-surface/90 p-1 shadow-sm backdrop-blur-md">
      {TOOLS.map((tool) => {
        const disabled = tool.requiresBoundary && !hasBoundary
        const active = activeTool === tool.key

        return (
          <button
            key={tool.key}
            type="button"
            title={disabled ? `${tool.label} (draw boundary first)` : tool.label}
            disabled={disabled}
            onClick={() => !disabled && onToolSelect(tool.key)}
            className={[
              'grid h-10 w-10 place-items-center rounded-lg transition-colors',
              active
                ? 'bg-primary-container text-on-primary-container'
                : disabled
                  ? 'cursor-not-allowed opacity-40 text-on-surface-variant'
                  : 'text-on-surface-variant hover:bg-surface-variant/50',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
          </button>
        )
      })}

      {/* Undo last point — only visible while boundary is being drawn. */}
      {isDrawing && (
        <>
          <div className="mx-1 my-0.5 h-px bg-outline-variant/30" />
          <button
            type="button"
            title="Undo last point"
            onClick={onUndoLastPoint}
            className="grid h-10 w-10 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant/50"
          >
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>
        </>
      )}
    </nav>
  )
}
