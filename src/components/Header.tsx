// Top app bar: logo, address search, season selector, style toggle.
// STUB — DESIGN.md §TopNavBar / Garden Analysis top bar.
export function Header() {
  return (
    <header className="pointer-events-auto absolute left-1/2 top-3.5 z-50 flex h-12 -translate-x-1/2 items-center gap-4 rounded-full border border-outline-variant/30 bg-surface/90 px-5 shadow-solar backdrop-blur-md">
      <span className="font-display text-lg font-extrabold text-primary">
        Garden&nbsp;Sun
      </span>
      <span className="font-body text-sm text-on-surface-variant">
        address search · season · style toggle
      </span>
    </header>
  )
}
