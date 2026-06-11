// Shade-casting obstacle panel — type picker, height input, shadow preview, draw button, list.
// Shares bottom-right slot with ZonePanel; only one is visible at a time.
import { useState } from 'react'
import type { Obstacle, ObstacleType, Season } from '../types'
import { getSeason, getSunTimes, getSunPosition, type LatLng } from '../lib/sunCalc'
import { calcShadowLength } from '../lib/shadowCalc'

// ── Obstacle catalogue (shade-casting only for now) ───────────────────────────

type DrawMode = 'draw_line_string' | 'draw_polygon'

interface ObstacleDef {
  type: ObstacleType
  label: string
  emoji: string
  drawMode: DrawMode
  presets: number[]
  defaultHeight: number
}

const OBSTACLE_DEFS: ObstacleDef[] = [
  { type: 'fence',       label: 'Fence',       emoji: '🪵', drawMode: 'draw_line_string', presets: [0.9, 1.2, 1.8, 2.4], defaultHeight: 1.8 },
  { type: 'wall',        label: 'Wall',        emoji: '🧱', drawMode: 'draw_line_string', presets: [0.9, 1.2, 1.8, 2.4], defaultHeight: 1.8 },
  { type: 'hedge',       label: 'Hedge',       emoji: '🌿', drawMode: 'draw_line_string', presets: [1.0, 1.5, 2.0, 3.0], defaultHeight: 1.5 },
  { type: 'tree',        label: 'Tree',        emoji: '🌳', drawMode: 'draw_polygon',     presets: [3, 5, 8, 12],        defaultHeight: 5   },
  { type: 'shed',        label: 'Shed',        emoji: '🏚', drawMode: 'draw_polygon',     presets: [2.2, 2.8, 3.5],      defaultHeight: 2.5 },
  { type: 'summerhouse', label: 'Summerhouse', emoji: '🏡', drawMode: 'draw_polygon',     presets: [2.2, 2.8, 3.5],      defaultHeight: 2.5 },
  { type: 'pergola',     label: 'Pergola',     emoji: '⛩',  drawMode: 'draw_polygon',     presets: [2.0, 2.5, 3.0],      defaultHeight: 2.5 },
]

const DEF_BY_TYPE = Object.fromEntries(OBSTACLE_DEFS.map((d) => [d.type, d])) as Record<ObstacleType, ObstacleDef | undefined>

// ── Shadow preview ────────────────────────────────────────────────────────────

function noonShadowLength(heightMetres: number, season: Season, location: LatLng): number | null {
  const config = getSeason(season)
  const times = getSunTimes(config.date, location)
  const pos = getSunPosition(times.solarNoon, location)
  return calcShadowLength(heightMetres, pos.altitude)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ObstaclePanelProps {
  obstacles: Obstacle[]
  season: Season
  location: LatLng
  isDrawing: boolean
  onStartDraw: (type: ObstacleType, heightMetres: number, drawMode: DrawMode) => void
  onDeleteObstacle: (id: string) => void
}

export function ObstaclePanel({
  obstacles,
  season,
  location,
  isDrawing,
  onStartDraw,
  onDeleteObstacle,
}: ObstaclePanelProps) {
  const [selectedType, setSelectedType] = useState<ObstacleType>('fence')
  const [height, setHeight] = useState<number>(1.8)

  const def = DEF_BY_TYPE[selectedType]!
  const shadowLen = noonShadowLength(height, season, location)

  function handleTypeSelect(type: ObstacleType) {
    const d = DEF_BY_TYPE[type]!
    setSelectedType(type)
    setHeight(d.defaultHeight)
  }

  function handlePreset(v: number) { setHeight(v) }

  function handleHeightInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value)
    if (!isNaN(v) && v > 0) setHeight(v)
  }

  function handleDraw() {
    if (!isDrawing) onStartDraw(selectedType, height, def.drawMode)
  }

  if (isDrawing) {
    const drawLabel = def.drawMode === 'draw_line_string' ? 'Click to place points, double-click to finish.' : 'Click to place corners, double-click to close.'
    return (
      <aside className="pointer-events-auto absolute bottom-3.5 right-3.5 z-40 w-72 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(28,26,23,0.14)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">{def.emoji}</span>
          <h2 className="font-display text-base font-bold text-on-surface">
            Drawing {def.label.toLowerCase()}…
          </h2>
        </div>
        <p className="mt-2 font-body text-sm text-on-surface-variant">{drawLabel}</p>
        <p className="mt-1 font-body text-xs text-on-surface-variant">
          Height: <span className="font-medium text-on-surface">{height}m</span>
          {shadowLen !== null && (
            <> · Noon shadow: <span className="font-medium text-on-surface">{shadowLen.toFixed(1)}m</span></>
          )}
        </p>
      </aside>
    )
  }

  return (
    <aside className="pointer-events-auto absolute bottom-3.5 right-3.5 z-40 w-72 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(28,26,23,0.14)]">
      <h2 className="font-display text-base font-bold text-on-surface">Obstacles</h2>
      <p className="mt-0.5 font-body text-xs text-on-surface-variant">
        Pick a type, set height, then draw on the map.
      </p>

      {/* Type picker */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {OBSTACLE_DEFS.map(({ type, label, emoji }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeSelect(type)}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 font-body text-xs font-medium transition-colors',
              selectedType === type
                ? 'bg-[#C85A38]/15 text-[#C85A38]'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/60',
            ].join(' ')}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Height */}
      <div className="mt-4">
        <p className="mb-1.5 font-body text-xs font-medium text-on-surface-variant">Height</p>
        <div className="flex flex-wrap gap-1.5">
          {def.presets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handlePreset(v)}
              className={[
                'rounded-full px-3 py-1 font-body text-xs font-medium transition-colors',
                height === v
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/60',
              ].join(' ')}
            >
              {v}m
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="0.1"
            max="30"
            step="0.1"
            value={height}
            onChange={handleHeightInput}
            className="w-20 rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 font-body text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="font-body text-sm text-on-surface-variant">metres</span>
          {shadowLen !== null && (
            <span className="ml-auto font-body text-xs text-on-surface-variant">
              Noon shadow: <span className="font-medium text-on-surface">{shadowLen.toFixed(1)}m</span>
            </span>
          )}
        </div>
      </div>

      {/* Draw button */}
      <button
        type="button"
        onClick={handleDraw}
        className="mt-4 w-full rounded-full bg-[#C85A38] px-4 py-2 font-body text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Draw on map
      </button>

      {/* Obstacle list */}
      {obstacles.length > 0 && (
        <>
          <div className="my-3 h-px bg-outline-variant/30" />
          <p className="mb-2 font-body text-xs font-medium text-on-surface-variant">Added obstacles</p>
          <ul className="flex flex-col gap-1">
            {obstacles.map((o) => {
              const d = DEF_BY_TYPE[o.type]
              return (
                <li
                  key={o.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-surface-container"
                >
                  <span className="text-base leading-none">{d?.emoji ?? '📍'}</span>
                  <span className="flex-1 font-body text-sm text-on-surface">{o.label}</span>
                  <span className="font-body text-xs text-on-surface-variant">{o.heightMetres}m</span>
                  <button
                    type="button"
                    title={`Delete ${o.label}`}
                    onClick={() => onDeleteObstacle(o.id)}
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
    </aside>
  )
}
