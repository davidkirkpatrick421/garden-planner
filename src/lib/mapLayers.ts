// Pure Mapbox GL layer helpers — no React.
// Call addBoundaryLayer / updateZoneLayers / updateObstacleLayers inside
// map.once('style.load', ...) after every style switch, because setStyle()
// wipes all user-added layers.
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { GeoJSONPolygon, Obstacle, Zone, ZoneType } from '../types'

// ── Boundary ──────────────────────────────────────────────────────────────────

const BOUNDARY_SOURCE = 'garden-boundary'

export function addBoundaryLayer(map: MapboxMap, boundary: GeoJSONPolygon): void {
  const existing = map.getSource(BOUNDARY_SOURCE)
  if (existing) {
    ;(existing as GeoJSONSource).setData(boundary)
    return
  }

  map.addSource(BOUNDARY_SOURCE, { type: 'geojson', data: boundary })

  map.addLayer({
    id: 'garden-boundary-fill',
    type: 'fill',
    source: BOUNDARY_SOURCE,
    paint: { 'fill-color': '#E8A830', 'fill-opacity': 0.12 },
  })

  // Dashed outline — DESIGN.md §Map SVG: stroke-dasharray="6,4".
  map.addLayer({
    id: 'garden-boundary-line',
    type: 'line',
    source: BOUNDARY_SOURCE,
    paint: { 'line-color': '#E8A830', 'line-width': 3, 'line-dasharray': [6, 4] },
  })
}

// ── Zones ─────────────────────────────────────────────────────────────────────

const ZONE_SOURCE = 'garden-zones'

// Per-type fill colours — muted, distinct, matches DESIGN.md palette.
const ZONE_COLOURS: Record<ZoneType, string> = {
  'raised-bed': '#4A8C5C',  // leaf green
  'open-bed':   '#2a6b2c',  // dark evergreen
  'patio':      '#9A9088',  // stone grey
  'lawn':       '#91d78a',  // light green
  'greenhouse': '#4878A8',  // sky blue
  'pond':       '#4878A8',  // sky blue
}

// Heat map fill colour: blue (shade) → yellow (partial sun) → amber (full sun).
// Matches CLAUDE.md §Three Visualisation Modes.
const HEAT_FILL_COLOUR = [
  'step', ['coalesce', ['get', 'sunHours'], 0],
  '#4878A8',   // 0–4 h  sky blue  (shade)
  4, '#F5DFA0', // 4–8 h  yellow    (partial sun)
  8, '#E8A830', // 8 h+   amber     (full sun)
]

const TYPE_FILL_COLOUR = [
  'match', ['get', 'type'],
  'raised-bed',  ZONE_COLOURS['raised-bed'],
  'open-bed',    ZONE_COLOURS['open-bed'],
  'patio',       ZONE_COLOURS['patio'],
  'lawn',        ZONE_COLOURS['lawn'],
  'greenhouse',  ZONE_COLOURS['greenhouse'],
  'pond',        ZONE_COLOURS['pond'],
  '#00450d',
]

function zoneDisplayText(zone: Zone, sunHours: number | undefined): string {
  if (sunHours === undefined) return zone.label
  return `${zone.label}\n${sunHours.toFixed(1)}h`
}

export function zonesToFeatureCollection(
  zones: Zone[],
  sunHoursByZone?: Map<string, number>,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => {
      const sunHours = sunHoursByZone?.get(z.id)
      return {
        type: 'Feature',
        id: z.id,
        geometry: z.boundary,
        properties: {
          id: z.id,
          type: z.type,
          label: z.label,
          sunHours: sunHours ?? null,
          displayText: zoneDisplayText(z, sunHours),
        },
      }
    }),
  }
}

/**
 * Add or update zone fill + line + label layers from the current zones array.
 * When sunHoursByZone is provided, fills switch to the heat map colour scale
 * and labels show per-zone sun hours.
 * Safe to call repeatedly — updates source data and paint if layers already exist.
 */
export function updateZoneLayers(
  map: MapboxMap,
  zones: Zone[],
  sunHoursByZone?: Map<string, number>,
): void {
  const hasHeatMap = (sunHoursByZone?.size ?? 0) > 0
  const data = zonesToFeatureCollection(zones, sunHoursByZone)
  const existing = map.getSource(ZONE_SOURCE)

  if (existing) {
    ;(existing as GeoJSONSource).setData(data)
    if (map.getLayer('garden-zones-fill')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty('garden-zones-fill', 'fill-color', hasHeatMap ? HEAT_FILL_COLOUR as any : TYPE_FILL_COLOUR as any)
      map.setPaintProperty('garden-zones-fill', 'fill-opacity', hasHeatMap ? 0.55 : 0.18)
    }
    return
  }

  map.addSource(ZONE_SOURCE, { type: 'geojson', data })

  map.addLayer({
    id: 'garden-zones-fill',
    type: 'fill',
    source: ZONE_SOURCE,
    paint: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'fill-color': (hasHeatMap ? HEAT_FILL_COLOUR : TYPE_FILL_COLOUR) as any,
      'fill-opacity': hasHeatMap ? 0.55 : 0.18,
    },
  })

  map.addLayer({
    id: 'garden-zones-line',
    type: 'line',
    source: ZONE_SOURCE,
    paint: {
      'line-color': '#1b5e20',
      'line-width': 1.5,
      'line-dasharray': [4, 3],
    },
  })

  map.addLayer({
    id: 'garden-zones-label',
    type: 'symbol',
    source: ZONE_SOURCE,
    layout: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'text-field': ['get', 'displayText'] as any,
      'text-anchor': 'center',
      'text-size': 11,
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-max-width': 8,
    },
    paint: {
      'text-color': '#1C1A17',
      'text-halo-color': 'rgba(255,255,255,0.85)',
      'text-halo-width': 1.5,
    },
  })
}

// ── Obstacles ─────────────────────────────────────────────────────────────────

const OBSTACLE_SOURCE = 'garden-obstacles'

// Shade-casting = terra red; feature = stone grey (data-driven).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OBSTACLE_COLOUR: any = ['match', ['get', 'category'], 'shade-casting', '#C85A38', '#C8BFB0']

export function updateObstacleLayers(map: MapboxMap, obstacles: Obstacle[]): void {
  const data: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: obstacles.map((o) => ({
      type: 'Feature',
      id: o.id,
      geometry: o.geometry,
      properties: { id: o.id, category: o.category, label: o.label, heightMetres: o.heightMetres },
    })),
  }

  const existing = map.getSource(OBSTACLE_SOURCE)
  if (existing) {
    ;(existing as GeoJSONSource).setData(data)
    return
  }

  map.addSource(OBSTACLE_SOURCE, { type: 'geojson', data })

  // LineString obstacles (fence, wall, hedge).
  map.addLayer({
    id: 'garden-obstacles-line',
    type: 'line',
    source: OBSTACLE_SOURCE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: ['==', '$type', 'LineString'] as any,
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': OBSTACLE_COLOUR, 'line-width': 3 },
  })

  // Polygon obstacle fill (shed, tree).
  map.addLayer({
    id: 'garden-obstacles-fill',
    type: 'fill',
    source: OBSTACLE_SOURCE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: ['==', '$type', 'Polygon'] as any,
    paint: { 'fill-color': OBSTACLE_COLOUR, 'fill-opacity': 0.25 },
  })

  // Polygon obstacle outline.
  map.addLayer({
    id: 'garden-obstacles-polygon-line',
    type: 'line',
    source: OBSTACLE_SOURCE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: ['==', '$type', 'Polygon'] as any,
    paint: { 'line-color': OBSTACLE_COLOUR, 'line-width': 2 },
  })
}
