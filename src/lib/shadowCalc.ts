// Obstacle height + sun position → shadow geometry.
// Source: CLAUDE.md §Shadow Calculation.

/** Radians. Below this altitude the sun is treated as down (CLAUDE.md gotcha:
 *  shadow length explodes near sunrise/sunset). */
export const MIN_ALTITUDE = 0.05

/**
 * Length of the shadow cast by an object of `heightMetres`, given the sun's
 * altitude. Returns null when the sun is too low to cast a usable shadow.
 */
export function calcShadowLength(
  heightMetres: number,
  altitudeRadians: number,
): number | null {
  if (altitudeRadians <= MIN_ALTITUDE) return null
  return heightMetres / Math.tan(altitudeRadians)
}

/**
 * Compass bearing (radians) the shadow falls along — opposite the sun.
 * Normalised to [0, 2π) so it never wraps past a full turn (CLAUDE.md gotcha).
 */
export function calcShadowBearing(azimuthRadians: number): number {
  return (azimuthRadians + Math.PI) % (2 * Math.PI)
}
