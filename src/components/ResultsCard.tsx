// Floating per-zone sun hours summary — bottom-left.
import type { Zone, Season } from '../types'

const SEASON_LABELS: Record<Season, string> = {
  'summer':        'Summer solstice',
  'spring-autumn': 'Spring / Autumn',
  'winter':        'Winter solstice',
}

interface ResultsCardProps {
  zones: Zone[]
  sunHoursByZone: Map<string, number>
  season: Season
}

export function ResultsCard({ zones, sunHoursByZone, season }: ResultsCardProps) {
  if (zones.length === 0) return null

  return (
    <aside className="pointer-events-auto absolute bottom-3.5 left-3.5 z-40 w-64 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(28,26,23,0.14)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-on-surface">Sun hours</h2>
        <span className="font-body text-xs text-on-surface-variant">{SEASON_LABELS[season]}</span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {zones.map((zone) => {
          const hrs = sunHoursByZone.get(zone.id)
          const pct = hrs !== undefined ? Math.min(hrs / 16, 1) : 0
          const barColour =
            hrs === undefined ? 'bg-outline-variant/30'
            : hrs >= 8        ? 'bg-[#E8A830]'
            : hrs >= 4        ? 'bg-[#F5DFA0]'
            :                   'bg-[#4878A8]'

          return (
            <li key={zone.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1 truncate font-body text-xs text-on-surface">
                  {zone.label}
                </span>
                <span className="shrink-0 font-body text-xs font-medium text-on-surface">
                  {hrs !== undefined ? `${hrs.toFixed(1)}h` : '—'}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColour}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {sunHoursByZone.size === 0 && (
        <p className="mt-2 font-body text-xs text-on-surface-variant">
          Calculating…
        </p>
      )}
    </aside>
  )
}
