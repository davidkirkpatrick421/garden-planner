// SunCalc.js wrapper + Belfast-aware season config.
// Source: CLAUDE.md §Sun Calculations.
import SunCalc from 'suncalc'
import type { SeasonConfig, SunPosition } from '../types'

/**
 * Three representative dates. Changing season re-runs the heat map loop.
 * At Belfast's latitude (54.7°N) the summer/winter gap is dramatic — that is
 * a core feature of the product, not an edge case.
 */
export const SEASONS: SeasonConfig[] = [
  {
    season: 'summer',
    date: new Date('2025-06-21'),
    label: 'Summer solstice',
    emoji: '☀',
    riseLabel: '04:43',
    setLabel: '22:08',
  },
  {
    season: 'spring-autumn',
    date: new Date('2025-03-21'),
    label: 'Spring / Autumn equinox',
    emoji: '🌱',
    riseLabel: '06:18',
    setLabel: '18:24',
  },
  {
    season: 'winter',
    date: new Date('2025-12-21'),
    label: 'Winter solstice',
    emoji: '❄',
    riseLabel: '08:44',
    setLabel: '15:52',
  },
]

export interface LatLng {
  lat: number
  lng: number
}

/** Sun altitude/azimuth (radians) at a given instant and place. */
export function getSunPosition(date: Date, loc: LatLng): SunPosition {
  const pos = SunCalc.getPosition(date, loc.lat, loc.lng)
  return { altitude: pos.altitude, azimuth: pos.azimuth }
}

/** Sunrise/sunset (and other solar event) times for a date and place. */
export function getSunTimes(date: Date, loc: LatLng): SunCalc.GetTimesResult {
  return SunCalc.getTimes(date, loc.lat, loc.lng)
}

/** Look up a season config by its key. */
export function getSeason(season: SeasonConfig['season']): SeasonConfig {
  const found = SEASONS.find((s) => s.season === season)
  if (!found) throw new Error(`Unknown season: ${season}`)
  return found
}
