// Zone sun hours → plant suitability label.
// Source: CLAUDE.md §Plant Panel matching rules.
import type { MatchLabel, Plant } from '../types'

/** How far outside a plant's range still counts as "OK" (hours). */
const TOLERANCE_HOURS = 1

/**
 * Match a zone's measured daily sun hours against a plant's required range.
 * - ideal: within the plant's [min, max] range
 * - ok:    within TOLERANCE_HOURS outside the range
 * - poor:  more than TOLERANCE_HOURS outside the range
 */
export function getMatchLabel(zoneSunHours: number, plant: Plant): MatchLabel {
  const { minSunHours, maxSunHours } = plant

  if (zoneSunHours >= minSunHours && zoneSunHours <= maxSunHours) return 'ideal'

  if (
    zoneSunHours >= minSunHours - TOLERANCE_HOURS &&
    zoneSunHours <= maxSunHours + TOLERANCE_HOURS
  ) {
    return 'ok'
  }

  return 'poor'
}

/** Human-facing label/symbol for a match (DESIGN.md uppercase display strings). */
export function matchDisplay(label: MatchLabel): { symbol: string; text: string } {
  switch (label) {
    case 'ideal':
      return { symbol: '✓', text: 'IDEAL' }
    case 'ok':
      return { symbol: '≈', text: 'MARGINAL' }
    case 'poor':
      return { symbol: '✗', text: 'POOR' }
  }
}
