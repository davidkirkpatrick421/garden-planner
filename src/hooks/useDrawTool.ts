// mapbox-gl-draw wrapper for boundary, zone, and obstacle drawing.
//
// Key design constraint: handleCreate must be a STABLE function reference for
// the lifetime of the hook. If it changes, map.off() can't unregister the old
// listener, causing them to accumulate — multiple fires per polygon, stale
// closures, wrong labels, duplicate zones.
//
// Solution: store options in a ref (updated every render) so handleCreate never
// needs options in its useCallback deps and is therefore truly stable.
import { useCallback, useRef, useState } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import type { GeoJSONPolygon, GeoJSONLineString } from '../types'
import type { RefObject } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

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
  startZone: () => void
  startObstacle: (mode: 'draw_line_string' | 'draw_polygon') => void
  /** Cancel whichever draw mode is active, re-enable dragPan, and clean up. */
  cancelDrawing: () => void
  undoLastPoint: () => void
}

export function useDrawTool(
  mapRef: RefObject<MapboxMap | null>,
  options: {
    onBoundaryComplete: (polygon: GeoJSONPolygon) => void
    onZoneComplete?: (polygon: GeoJSONPolygon) => void
    onObstacleComplete?: (geometry: GeoJSONPolygon | GeoJSONLineString) => void
  },
): UseDrawToolResult {
  // Always-current options — updated every render, read only inside callbacks.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const drawRef = useRef<MapboxDraw | null>(null)
  const isDrawingRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const modeRef = useRef<'boundary' | 'zone' | 'obstacle' | null>(null)

  // Stable for the lifetime of the hook — only depends on mapRef which is also stable.
  const handleCreate = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const map = mapRef.current
      if (!map || !drawRef.current) return

      const geometry = e.features[0]?.geometry as GeoJSONPolygon | GeoJSONLineString | undefined
      if (!geometry) return

      if (modeRef.current === 'boundary') {
        const polygon = geometry as GeoJSONPolygon
        isDrawingRef.current = false
        setIsDrawing(false)
        modeRef.current = null
        map.dragPan.enable()
        map.off('draw.create', handleCreate)
        map.removeControl(drawRef.current)
        drawRef.current = null
        optionsRef.current.onBoundaryComplete(polygon)

      } else if (modeRef.current === 'zone') {
        const polygon = geometry as GeoJSONPolygon
        // Call through the ref — always gets the latest callback, never stale.
        optionsRef.current.onZoneComplete?.(polygon)
        // Defer BOTH deleteAll and changeMode — calling either inside the draw.create
        // handler can conflict with MapboxDraw's internal state machine, leaving the
        // control in simple_select and blocking further drawing.
        const draw = drawRef.current
        requestAnimationFrame(() => {
          if (!draw) return
          draw.deleteAll()
          draw.changeMode('draw_polygon')
        })

      } else if (modeRef.current === 'obstacle') {
        // One-shot — clean up draw control exactly like boundary mode.
        isDrawingRef.current = false
        setIsDrawing(false)
        modeRef.current = null
        map.dragPan.enable()
        map.off('draw.create', handleCreate)
        map.removeControl(drawRef.current)
        drawRef.current = null
        optionsRef.current.onObstacleComplete?.(geometry)
      }
    },
    [mapRef], // truly stable — no options in deps
  )

  const startBoundary = useCallback(() => {
    const map = mapRef.current
    if (!map || isDrawingRef.current) return

    const draw = new MapboxDraw({ displayControlsDefault: false, controls: {}, styles: DRAW_STYLES })
    drawRef.current = draw
    modeRef.current = 'boundary'
    isDrawingRef.current = true
    setIsDrawing(true)

    map.addControl(draw)
    draw.changeMode('draw_polygon')
    map.dragPan.disable()
    map.on('draw.create', handleCreate)
  }, [mapRef, handleCreate])

  const startZone = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (!drawRef.current) {
      const draw = new MapboxDraw({ displayControlsDefault: false, controls: {}, styles: DRAW_STYLES })
      drawRef.current = draw
      map.addControl(draw)
      map.on('draw.create', handleCreate)
    }

    modeRef.current = 'zone'
    isDrawingRef.current = true
    setIsDrawing(true)
    drawRef.current.changeMode('draw_polygon')
  }, [mapRef, handleCreate])

  const startObstacle = useCallback((mode: 'draw_line_string' | 'draw_polygon') => {
    const map = mapRef.current
    if (!map || isDrawingRef.current) return

    const draw = new MapboxDraw({ displayControlsDefault: false, controls: {}, styles: DRAW_STYLES })
    drawRef.current = draw
    modeRef.current = 'obstacle'
    isDrawingRef.current = true
    setIsDrawing(true)

    map.addControl(draw)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw.changeMode(mode as any)
    map.dragPan.disable()
    map.on('draw.create', handleCreate)
  }, [mapRef, handleCreate])

  const cancelDrawing = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (drawRef.current) {
      drawRef.current.deleteAll()
      map.off('draw.create', handleCreate) // same stable reference — correctly unregisters
      map.removeControl(drawRef.current)
      drawRef.current = null
    }

    modeRef.current = null
    isDrawingRef.current = false
    setIsDrawing(false)
    map.dragPan.enable()
  }, [mapRef, handleCreate])

  const undoLastPoint = useCallback(() => {
    const map = mapRef.current
    if (!map || !isDrawingRef.current) return

    const container = map.getContainer()
    const opts: KeyboardEventInit = { key: 'Backspace', bubbles: true, cancelable: true }
    container.dispatchEvent(new KeyboardEvent('keydown', opts))
    container.dispatchEvent(new KeyboardEvent('keyup', opts))
  }, [mapRef])

  return { isDrawing, startBoundary, startZone, startObstacle, cancelDrawing, undoLastPoint }
}
