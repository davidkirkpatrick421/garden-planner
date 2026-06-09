// Pure Mapbox GL layer helpers — no React.
// Call addBoundaryLayer inside map.once('style.load', ...) after every style
// switch, because setStyle() wipes all user-added sources and layers.
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { GeoJSONPolygon } from '../types'

const SOURCE_ID = 'garden-boundary'

export function addBoundaryLayer(map: MapboxMap, boundary: GeoJSONPolygon): void {
  const existing = map.getSource(SOURCE_ID)
  if (existing) {
    // Source survives if style was re-applied without a full switch — update data.
    ;(existing as GeoJSONSource).setData(boundary)
    return
  }

  map.addSource(SOURCE_ID, { type: 'geojson', data: boundary })

  // Subtle fill so the garden area is softly highlighted.
  map.addLayer({
    id: 'garden-boundary-fill',
    type: 'fill',
    source: SOURCE_ID,
    paint: { 'fill-color': '#00450d', 'fill-opacity': 0.06 },
  })

  // Dashed outline — DESIGN.md §Map SVG: stroke-dasharray="6,4", primary-container colour.
  map.addLayer({
    id: 'garden-boundary-line',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': '#1b5e20',
      'line-width': 2.5,
      'line-dasharray': [6, 4],
    },
  })
}
