// Bottom bar: sunrise/sunset, view-mode toggle, time slider, play.
// STUB — DESIGN.md §Bottom Timeline Bar. Time slider drives Modes B/C.
export function SunTimeline() {
  return (
    <div className="pointer-events-auto absolute bottom-3.5 left-1/2 z-40 flex h-14 w-[min(600px,calc(100%-28px))] -translate-x-1/2 items-center gap-4 rounded-2xl border border-outline-variant/20 bg-surface/90 px-6 shadow-solar backdrop-blur-md">
      <span className="font-body text-sm text-on-surface-variant">04:43</span>
      <div className="h-1 flex-1 rounded-full bg-surface-variant" />
      <span className="font-body text-sm text-on-surface-variant">22:08</span>
    </div>
  )
}
