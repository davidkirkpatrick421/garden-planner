// mapbox-gl-draw wrapper + draw-mode pan lock.
// STUB — wires @mapbox/mapbox-gl-draw, disables dragPan while drawing, and
// surfaces an undo-last-point action (CLAUDE.md §Draw Mode Pan Lock).
import type { GeoJSONPolygon } from '../types'

export interface UseDrawToolResult {
  isDrawing: boolean
  startBoundary: () => void
  undoLastPoint: () => void
  /** Fired when a polygon is closed (draw.create). */
  onComplete?: (polygon: GeoJSONPolygon) => void
}

export function useDrawTool(): UseDrawToolResult {
  // TODO: instantiate MapboxDraw, handle draw.create / dragPan lock.
  return {
    isDrawing: false,
    startBoundary: () => {},
    undoLastPoint: () => {},
  }
}
