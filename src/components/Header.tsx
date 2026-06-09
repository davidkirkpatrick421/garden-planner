// Top app bar: logo, address search, season selector, style toggle.
// hasBoundary shows the "Satellite" toggle (flip back to verify boundary).
// TODO: implement address search + season picker + satellite toggle.
interface HeaderProps {
  hasBoundary: boolean
}

export function Header({ hasBoundary }: HeaderProps) {
  return (
    <header className="pointer-events-auto absolute left-1/2 top-3.5 z-50 flex h-12 -translate-x-1/2 items-center gap-4 rounded-full border border-outline-variant/30 bg-surface/90 px-5 shadow-solar backdrop-blur-md">
      <span className="font-display text-lg font-extrabold text-primary">
        Garden&nbsp;Sun
      </span>
      <span className="font-body text-sm text-on-surface-variant">
        {hasBoundary ? 'address search · season · satellite toggle' : 'address search · season'}
      </span>
    </header>
  )
}
