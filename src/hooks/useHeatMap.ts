// Triggers heat map calc and manages result state (zoneId → sun hours).
// STUB — calls lib/heatMap.calculateHeatMap and recalcs on the triggers from
// CLAUDE.md (boundary drawn, season change, obstacle add/edit/delete).
import { useState } from 'react'

export interface UseHeatMapResult {
  /** zoneId → daily sun hours. */
  sunHoursByZone: Map<string, number>
  isCalculating: boolean
  recalculate: () => void
}

export function useHeatMap(): UseHeatMapResult {
  const [sunHoursByZone] = useState<Map<string, number>>(new Map())
  // TODO: wire calculateHeatMap with current boundary/obstacles/season/location.
  return {
    sunHoursByZone,
    isCalculating: false,
    recalculate: () => {},
  }
}
