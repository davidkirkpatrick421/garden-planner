// Sunrise→sunset accumulation loop: how many lit hours each zone receives.
// Source: CLAUDE.md §Heat Map Calculation.
//
// STATUS: loop skeleton. The per-zone shadow-intersection test is the remaining
// piece (marked TODO below) — until then this returns an empty accumulator.
import type { GeoJSONPolygon, Obstacle, SeasonConfig } from '../types'
import { getSunPosition, getSunTimes, type LatLng } from './sunCalc'
import { MIN_ALTITUDE } from './shadowCalc'

const INTERVAL_MINUTES = 15

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

/**
 * Walk the day in 15-minute steps. For each lit interval, determine which zones
 * are in sun vs shadow and accumulate lit time.
 *
 * @returns Map of zoneId → sun hours for the day.
 */
export function calculateHeatMap(
  _boundary: GeoJSONPolygon,
  obstacles: Obstacle[],
  season: SeasonConfig,
  location: LatLng,
): Map<string, number> {
  const times = getSunTimes(season.date, location)
  const accumulator = new Map<string, number>()

  const shadeCasters = obstacles.filter((o) => o.category === 'shade-casting')

  let current = times.sunrise
  while (current < times.sunset) {
    const pos = getSunPosition(current, location)

    if (pos.altitude > MIN_ALTITUDE) {
      // TODO: project each shade-casting obstacle to a shadow polygon for this
      // sun position (via shadowCalc), then test each zone polygon against the
      // union of shadows. If a zone is not shadowed, add INTERVAL_MINUTES / 60
      // to its accumulator entry. Until that lands, `shadeCasters` is unused.
      void shadeCasters
    }

    current = addMinutes(current, INTERVAL_MINUTES)
  }

  return accumulator
}
