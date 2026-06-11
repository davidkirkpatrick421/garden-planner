// Triggers heat map calc and manages result state (zoneId → sun hours).
// Recalculates whenever boundary, zones, obstacles, season, or location change.
// Source: CLAUDE.md §Heat Map Calculation.
import { useState, useEffect } from 'react'
import type { GeoJSONPolygon, Obstacle, Zone, Season } from '../types'
import { calculateHeatMap } from '../lib/heatMap'
import { getSeason, type LatLng } from '../lib/sunCalc'

interface UseHeatMapOptions {
  boundary: GeoJSONPolygon | null
  zones: Zone[]
  obstacles: Obstacle[]
  season: Season
  location: LatLng
}

export interface UseHeatMapResult {
  sunHoursByZone: Map<string, number>
  isCalculating: boolean
}

export function useHeatMap({
  boundary,
  zones,
  obstacles,
  season,
  location,
}: UseHeatMapOptions): UseHeatMapResult {
  const [sunHoursByZone, setSunHoursByZone] = useState<Map<string, number>>(new Map())
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    if (!boundary || zones.length === 0) {
      setSunHoursByZone(new Map())
      return
    }

    setIsCalculating(true)

    // Defer to next tick so the UI can update (show spinner, etc.) before the
    // synchronous calculation blocks the thread.
    const id = setTimeout(() => {
      const seasonConfig = getSeason(season)
      const result = calculateHeatMap(boundary, obstacles, zones, seasonConfig, location)
      setSunHoursByZone(result)
      setIsCalculating(false)
    }, 0)

    return () => clearTimeout(id)
    // location is spread into primitives by the caller — stable reference unless values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary, zones, obstacles, season, location.lat, location.lng])

  return { sunHoursByZone, isCalculating }
}
