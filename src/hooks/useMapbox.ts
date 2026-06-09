// Map instance lifecycle, style switching, layer management.
// STUB — MapCanvas.tsx currently owns map init directly; this hook will absorb
// that logic plus satellite↔warm style switching (CLAUDE.md §Map Architecture).
import { useRef } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

export interface UseMapboxResult {
  mapRef: React.RefObject<MapboxMap | null>
}

export function useMapbox(): UseMapboxResult {
  const mapRef = useRef<MapboxMap | null>(null)
  // TODO: move map init, style transition, and layer re-adding here.
  return { mapRef }
}
