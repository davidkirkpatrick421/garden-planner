// Sunrise→sunset accumulation loop: how many lit hours each zone receives.
// Source: CLAUDE.md §Heat Map Calculation.
import type { GeoJSONPolygon, GeoJSONLineString, Obstacle, Zone, SeasonConfig } from '../types'
import { getSunPosition, getSunTimes, type LatLng } from './sunCalc'
import { calcShadowLength, MIN_ALTITUDE } from './shadowCalc'

const INTERVAL_MINUTES = 15
const METRES_PER_DEG_LAT = 111_319

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

/**
 * Centroid of a GeoJSON polygon ring (average of vertices, excluding closing duplicate).
 * Exported so App.tsx can derive garden location from the boundary polygon.
 */
export function polygonCentroid(polygon: GeoJSONPolygon): [number, number] {
  const ring = polygon.coordinates[0]
  const n = ring.length - 1 // GeoJSON closes the ring — last point = first
  let lng = 0, lat = 0
  for (let i = 0; i < n; i++) { lng += ring[i][0]; lat += ring[i][1] }
  return [lng / n, lat / n]
}

/**
 * Ray-casting point-in-polygon test.
 * Returns true when `pt` is inside `ring`.
 */
function pointInRing(pt: [number, number], ring: [number, number][]): boolean {
  const [px, py] = pt
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

/**
 * Shadow displacement vector in degrees of longitude/latitude.
 *
 * SunCalc azimuth convention: 0 = south, +π/2 = west, measured clockwise from south.
 * Shadow falls OPPOSITE to the sun direction:
 *   east component (metres)  = sin(azimuth) × length
 *   north component (metres) = cos(azimuth) × length
 *
 * Verified:
 *   α=0 (sun in south)  → shadow north   ✓
 *   α=π/2 (sun in west) → shadow east    ✓
 *   α=−π/2 (sun in east)→ shadow west    ✓
 */
function shadowDisplacement(
  heightMetres: number,
  pos: { altitude: number; azimuth: number },
  loc: LatLng,
): { dlng: number; dlat: number } | null {
  const len = calcShadowLength(heightMetres, pos.altitude)
  if (len === null) return null
  const dxMetres = Math.sin(pos.azimuth) * len
  const dyMetres = Math.cos(pos.azimuth) * len
  return {
    dlng: dxMetres / (METRES_PER_DEG_LAT * Math.cos(loc.lat * (Math.PI / 180))),
    dlat: dyMetres / METRES_PER_DEG_LAT,
  }
}

// Build shadow polygon for a LineString obstacle (fence, wall, hedge).
// The shadow is the band swept by displacing each vertex by the shadow vector.
function lineStringShadow(
  coords: [number, number][],
  d: { dlng: number; dlat: number },
): [number, number][] {
  const displaced = coords.map(([lng, lat]): [number, number] => [lng + d.dlng, lat + d.dlat])
  return [...coords, ...displaced.reverse()]
}

// Build shadow polygon for a Polygon obstacle (shed, summerhouse, tree).
// Displaces the outer ring; the resulting polygon represents the shadow cast beyond the obstacle.
function polygonObstacleShadow(
  ring: [number, number][],
  d: { dlng: number; dlat: number },
): [number, number][] {
  const base = ring.slice(0, -1) // drop GeoJSON closing duplicate
  const displaced = base.map(([lng, lat]): [number, number] => [lng + d.dlng, lat + d.dlat])
  return [...base, ...displaced.reverse(), base[0]]
}

function obstacleToShadow(
  obstacle: Obstacle,
  pos: { altitude: number; azimuth: number },
  loc: LatLng,
): [number, number][] | null {
  const d = shadowDisplacement(obstacle.heightMetres, pos, loc)
  if (!d) return null
  if (obstacle.geometry.type === 'LineString') {
    return lineStringShadow(
      (obstacle.geometry as GeoJSONLineString).coordinates as [number, number][],
      d,
    )
  }
  return polygonObstacleShadow(
    (obstacle.geometry as GeoJSONPolygon).coordinates[0] as [number, number][],
    d,
  )
}

/**
 * Walk the day in 15-minute steps. For each lit interval, test each zone's
 * centroid against the union of shadow polygons. Accumulate lit time.
 *
 * Recalculate when: boundary drawn, season changes, any obstacle added/changed/deleted.
 *
 * @returns Map of zoneId → sun hours for the day.
 */
export function calculateHeatMap(
  _boundary: GeoJSONPolygon,
  obstacles: Obstacle[],
  zones: Zone[],
  season: SeasonConfig,
  location: LatLng,
): Map<string, number> {
  const times = getSunTimes(season.date, location)
  const accumulator = new Map<string, number>(zones.map((z) => [z.id, 0]))

  const shadeCasters = obstacles.filter((o) => o.category === 'shade-casting')
  // Pre-compute centroids — constant for the entire day loop.
  const centroids = new Map(zones.map((z) => [z.id, polygonCentroid(z.boundary)]))

  let current = times.sunrise
  while (current < times.sunset) {
    const pos = getSunPosition(current, location)

    if (pos.altitude > MIN_ALTITUDE) {
      const shadows = shadeCasters
        .map((o) => obstacleToShadow(o, pos, location))
        .filter((s): s is [number, number][] => s !== null)

      for (const zone of zones) {
        const centroid = centroids.get(zone.id)!
        const inShadow = shadows.some((ring) => pointInRing(centroid, ring))
        if (!inShadow) {
          accumulator.set(zone.id, accumulator.get(zone.id)! + INTERVAL_MINUTES / 60)
        }
      }
    }

    current = addMinutes(current, INTERVAL_MINUTES)
  }

  return accumulator
}
