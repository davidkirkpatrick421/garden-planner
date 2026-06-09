// Pure Mapbox GL layer helpers — no React.
// Call addBoundaryLayer / updateZoneLayers inside map.once('style.load', ...)
// after every style switch, because setStyle() wipes all user-added layers.
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { GeoJSONPolygon, Zone, ZoneType } from '../types'

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

export function zonesToFeatureCollection(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      id: z.id,
      geometry: z.boundary,
      properties: { id: z.id, type: z.type, label: z.label },
    })),
  }
}

/**
 * Add or update zone fill + line layers from the current zones array.
 * Safe to call repeatedly — updates source data if layers already exist.
 */
export function updateZoneLayers(map: MapboxMap, zones: Zone[]): void {
  const data = zonesToFeatureCollection(zones)
  const existing = map.getSource(ZONE_SOURCE)

  if (existing) {
    ;(existing as GeoJSONSource).setData(data)
    return
  }

  map.addSource(ZONE_SOURCE, { type: 'geojson', data })

  // Data-driven fill colour keyed on the 'type' feature property.
  map.addLayer({
    id: 'garden-zones-fill',
    type: 'fill',
    source: ZONE_SOURCE,
    paint: {
      'fill-color': [
        'match', ['get', 'type'],
        'raised-bed',  ZONE_COLOURS['raised-bed'],
        'open-bed',    ZONE_COLOURS['open-bed'],
        'patio',       ZONE_COLOURS['patio'],
        'lawn',        ZONE_COLOURS['lawn'],
        'greenhouse',  ZONE_COLOURS['greenhouse'],
        'pond',        ZONE_COLOURS['pond'],
        '#00450d', // fallback
      ],
      'fill-opacity': 0.18,
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
}
