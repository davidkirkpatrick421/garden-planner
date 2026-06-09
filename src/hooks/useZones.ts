// Zone state + per-zone sun hours.
// STUB — zones are the unit of plant matching (CLAUDE.md §Zone System).
import { useState } from 'react'
import type { Zone } from '../types'

export interface UseZonesResult {
  zones: Zone[]
  selectedZoneId: string | null
  addZone: (zone: Zone) => void
  removeZone: (id: string) => void
  selectZone: (id: string | null) => void
}

export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  return {
    zones,
    selectedZoneId,
    addZone: (zone) => setZones((prev) => [...prev, zone]),
    removeZone: (id) => setZones((prev) => prev.filter((z) => z.id !== id)),
    selectZone: setSelectedZoneId,
  }
}
