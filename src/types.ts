// Garden Sun — the single TypeScript contract everything else conforms to.
// Source: CLAUDE.md §TypeScript Types. Do not use `any`.

export interface Garden {
  id: string
  name: string
  boundary: GeoJSONPolygon
  location: { lat: number; lng: number }
  createdAt: Date
}

export interface Zone {
  id: string
  gardenId: string
  type: ZoneType
  label: string
  boundary: GeoJSONPolygon
  heightMetres?: number // raised-bed only — soil depth, not shadow height
  sunHours?: number // calculated by heat map loop, not user input
}

export type ZoneType =
  | 'raised-bed'
  | 'open-bed'
  | 'patio'
  | 'lawn'
  | 'greenhouse'
  | 'pond'

export interface Obstacle {
  id: string
  gardenId: string
  type: ObstacleType
  category: 'shade-casting' | 'feature'
  geometry: GeoJSONLineString | GeoJSONPolygon
  heightMetres: number // drives shadow calc — 0 for feature-only types
  label: string
}

// Shade-casting = shadow trig runs on save
// Feature = zone marker only, no shadow calculation
export type ObstacleType =
  | 'fence'
  | 'wall'
  | 'hedge'
  | 'tree'
  | 'pergola'
  | 'shed'
  | 'summerhouse'
  | 'arch'
  | 'raised-bed-feature'
  | 'patio'
  | 'pond'
  | 'furniture'
  | 'compost'
  | 'cold-frame'

export interface PlantPlacement {
  id: string
  zoneId: string
  plantId: string
  position: GeoJSONPoint
}

export interface Plant {
  id: string
  commonName: string
  latinName?: string
  emoji: string
  sunRequirement: 'full-sun' | 'partial' | 'shade'
  minSunHours: number
  maxSunHours: number
  type: 'vegetable' | 'herb' | 'fruit' | 'flower' | 'shrub'
  perennial: boolean
}

export type MatchLabel = 'ideal' | 'ok' | 'poor'

export type Season = 'summer' | 'spring-autumn' | 'winter'

export interface SeasonConfig {
  season: Season
  date: Date // representative date used for SunCalc calculations
  label: string
  emoji: string
  riseLabel: string // display string e.g. "04:43"
  setLabel: string // display string e.g. "22:08"
}

export interface SunPosition {
  altitude: number // radians above horizon
  azimuth: number // radians, measured from south
}

// ── GeoJSON minimal types ──
export interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number]
}
export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}
export interface GeoJSONLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

// ── App-wide constants ──
/** Default map centre — Carrickfergus, Co. Antrim (CLAUDE.md "What to Build Next"). */
export const DEFAULT_LOCATION = { lat: 54.7156, lng: -5.8064 } as const
export const DEFAULT_ZOOM = 16
