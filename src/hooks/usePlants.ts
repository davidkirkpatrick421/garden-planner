// Plant search, zone matching, and placement state.
// STUB — CLAUDE.md §Plant Panel. Production reads plants from Supabase; this
// will hold the search query, filtered results, and active placement.
import { useState } from 'react'
import type { Plant, PlantPlacement } from '../types'

export interface UsePlantsResult {
  query: string
  setQuery: (q: string) => void
  results: Plant[]
  placements: PlantPlacement[]
  /** Plant currently armed for click-to-place, if any. */
  placingPlant: Plant | null
  beginPlacement: (plant: Plant) => void
  cancelPlacement: () => void
}

export function usePlants(): UsePlantsResult {
  const [query, setQuery] = useState('')
  const [placingPlant, setPlacingPlant] = useState<Plant | null>(null)

  // TODO: query Supabase plants table; compute matches against selected zone.
  return {
    query,
    setQuery,
    results: [],
    placements: [],
    placingPlant,
    beginPlacement: setPlacingPlant,
    cancelPlacement: () => setPlacingPlant(null),
  }
}
