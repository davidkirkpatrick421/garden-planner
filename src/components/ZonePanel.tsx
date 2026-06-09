// Zone drawing panel — type picker + drawn zone list.
// Shown when the Zones tool is active and a boundary exists.
import type { Zone, ZoneType } from '../types'

interface ZonePanelProps {
  zones: Zone[]
  selectedType: ZoneType
  selectedZoneId: string | null
  onSelectType: (type: ZoneType) => void
  onSelectZone: (id: string | null) => void
  onDeleteZone: (id: string) => void
}

const ZONE_TYPES: { type: ZoneType; label: string; emoji: string }[] = [
  { type: 'raised-bed',  label: 'Raised bed',  emoji: '🌱' },
  { type: 'open-bed',    label: 'Open bed',    emoji: '🌿' },
  { type: 'patio',       label: 'Patio',       emoji: '☀' },
  { type: 'lawn',        label: 'Lawn',        emoji: '🟩' },
  { type: 'greenhouse',  label: 'Greenhouse',  emoji: '🏡' },
  { type: 'pond',        label: 'Pond',        emoji: '💧' },
]

export function ZonePanel({
  zones,
  selectedType,
  selectedZoneId,
  onSelectType,
  onSelectZone,
  onDeleteZone,
}: ZonePanelProps) {
  return (
    <aside className="pointer-events-auto absolute bottom-20 right-3.5 z-40 w-72 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-solar">
      <h2 className="font-display text-base font-bold text-on-surface">Zones</h2>
      <p className="mt-0.5 font-body text-xs text-on-surface-variant">
        Pick a type, then draw on the map.
      </p>

      {/* Type picker */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ZONE_TYPES.map(({ type, label, emoji }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelectType(type)}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 font-body text-xs font-medium transition-colors',
              selectedType === type
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/60',
            ].join(' ')}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Zone list */}
      {zones.length > 0 && (
        <>
          <div className="my-3 h-px bg-outline-variant/30" />
          <p className="mb-2 font-body text-xs font-medium text-on-surface-variant">
            Your zones
          </p>
          <ul className="flex flex-col gap-1">
            {zones.map((zone) => {
              const meta = ZONE_TYPES.find((t) => t.type === zone.type)
              const isSelected = zone.id === selectedZoneId
              return (
                <li
                  key={zone.id}
                  className={[
                    'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                    isSelected
                      ? 'bg-surface-container-high'
                      : 'hover:bg-surface-container',
                  ].join(' ')}
                  onClick={() => onSelectZone(isSelected ? null : zone.id)}
                >
                  <span className="text-base leading-none">{meta?.emoji}</span>
                  <span className="flex-1 font-body text-sm text-on-surface">
                    {zone.label}
                  </span>
                  <span className="font-body text-xs text-on-surface-variant">
                    {zone.sunHours != null ? `${zone.sunHours.toFixed(1)} hrs` : '— hrs'}
                  </span>
                  <button
                    type="button"
                    title={`Delete ${zone.label}`}
                    onClick={(e) => { e.stopPropagation(); onDeleteZone(zone.id) }}
                    className="ml-1 grid h-6 w-6 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {zones.length === 0 && (
        <p className="mt-3 font-body text-xs text-on-surface-variant">
          Click on the map to start drawing a zone.
        </p>
      )}
    </aside>
  )
}
