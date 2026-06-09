// mapbox-gl-draw wrapper for garden boundary drawing.
// Handles: draw_polygon mode, dragPan lock, undo-last-point, custom styling.
import { useCallback, useRef, useState } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { GeoJSONPolygon } from '../types'
import type { RefObject } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

// DESIGN.md solar-gold + evergreen palette — replaces mapbox-gl-draw defaults.
const DRAW_STYLES: MapboxDraw.MapboxDrawOptions['styles'] = [
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
    paint: { 'fill-color': '#00450d', 'fill-opacity': 0.06 },
  },
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'false']],
    paint: { 'fill-color': '#00450d', 'fill-opacity': 0.04 },
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
    paint: { 'line-color': '#fdc003', 'line-width': 2.5, 'line-dasharray': [2, 2] },
  },
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'false']],
    paint: { 'line-color': '#1b5e20', 'line-width': 2 },
  },
  {
    id: 'gl-draw-point-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#1b5e20',
      'circle-stroke-width': 2,
    },
  },
  {
    id: 'gl-draw-point-inactive',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'false']],
    paint: {
      'circle-radius': 5,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#1b5e20',
      'circle-stroke-width': 1.5,
    },
  },
]

export interface UseDrawToolResult {
  isDrawing: boolean
  startBoundary: () => void
  undoLastPoint: () => void
}

export function useDrawTool(
  mapRef: RefObject<MapboxMap | null>,
  options: { onComplete: (polygon: GeoJSONPolygon) => void },
): UseDrawToolResult {
  const drawRef = useRef<MapboxDraw | null>(null)
  // isDrawingRef for synchronous checks inside callbacks; isDrawing state for re-renders.
  const isDrawingRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)

  // Stable reference so map.on/off can unregister the same function.
  const handleCreate = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const map = mapRef.current
      if (!map || !drawRef.current) return

      const polygon = e.features[0]?.geometry as GeoJSONPolygon | undefined
      if (!polygon) return

      isDrawingRef.current = false
      setIsDrawing(false)
      map.dragPan.enable()

      // Remove the draw control — the boundary becomes a permanent GL layer.
      map.off('draw.create', handleCreate)
      map.removeControl(drawRef.current)
      drawRef.current = null

      options.onComplete(polygon)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapRef, options.onComplete],
  )

  const startBoundary = useCallback(() => {
    const map = mapRef.current
    if (!map || isDrawingRef.current) return

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: DRAW_STYLES,
    })

    drawRef.current = draw
    isDrawingRef.current = true
    setIsDrawing(true)

    map.addControl(draw)
    draw.changeMode('draw_polygon')
    map.dragPan.disable() // CLAUDE.md §Draw Mode Pan Lock

    map.on('draw.create', handleCreate)
  }, [mapRef, handleCreate])

  const undoLastPoint = useCallback(() => {
    const map = mapRef.current
    if (!map || !isDrawingRef.current) return

    // MapboxDraw handles Backspace natively in draw_polygon mode.
    const container = map.getContainer()
    const opts: KeyboardEventInit = { key: 'Backspace', bubbles: true, cancelable: true }
    container.dispatchEvent(new KeyboardEvent('keydown', opts))
    container.dispatchEvent(new KeyboardEvent('keyup', opts))
  }, [mapRef])

  return { isDrawing, startBoundary, undoLastPoint }
}
