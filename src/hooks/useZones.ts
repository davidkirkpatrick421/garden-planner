import { useCallback, useState } from 'react'
import type { Zone, ZoneType } from '../types'

export interface UseZonesResult {
  zones: Zone[]
  selectedType: ZoneType
  selectedZoneId: string | null
  setSelectedType: (type: ZoneType) => void
  addZone: (zone: Zone) => void
  removeZone: (id: string) => void
  selectZone: (id: string | null) => void
}

export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedType, setSelectedType] = useState<ZoneType>('raised-bed')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const addZone = useCallback(
    (zone: Zone) => setZones((prev) => [...prev, zone]),
    [],
  )

  const removeZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
    setSelectedZoneId((prev) => (prev === id ? null : prev))
  }, [])

  const selectZone = useCallback(
    (id: string | null) => setSelectedZoneId(id),
    [],
  )

  return { zones, selectedType, selectedZoneId, setSelectedType, addZone, removeZone, selectZone }
}
