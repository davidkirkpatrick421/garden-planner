import { useCallback, useRef, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapCanvas } from './components/MapCanvas'
import { Header } from './components/Header'
import { ToolStrip } from './components/ToolStrip'
import { SunTimeline } from './components/SunTimeline'
import { ResultsCard } from './components/ResultsCard'
import { ZonePanel } from './components/ZonePanel'
import { useDrawTool } from './hooks/useDrawTool'
import { useZones } from './hooks/useZones'
import { addBoundaryLayer, updateZoneLayers } from './lib/mapLayers'
import type { GeoJSONPolygon, Zone, ZoneType } from './types'

const WARM_STYLE = 'mapbox://styles/mapbox/standard'

type ActiveTool = 'boundary' | 'zones' | 'obstacles' | 'plants' | null

function generateZoneLabel(zones: Zone[], type: ZoneType): string {
  const typeLabels: Record<ZoneType, string> = {
    'raised-bed': 'Raised bed',
    'open-bed':   'Open bed',
    'patio':      'Patio',
    'lawn':       'Lawn',
    'greenhouse': 'Greenhouse',
    'pond':       'Pond',
  }
  const count = zones.filter((z) => z.type === type).length
  return `${typeLabels[type]} ${String.fromCharCode(65 + count)}`
}

function App() {
  const mapRef = useRef<MapboxMap | null>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [boundary, setBoundary] = useState<GeoJSONPolygon | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const {
    zones, selectedType, selectedZoneId,
    setSelectedType, addZone, removeZone, selectZone,
  } = useZones()

  // Refs that are always current — let callbacks read latest values without
  // being recreated every time state changes (which would break listener stability).
  const zonesRef = useRef<Zone[]>(zones)
  zonesRef.current = zones
  const selectedTypeRef = useRef<ZoneType>(selectedType)
  selectedTypeRef.current = selectedType

  // Stable — reads boundary via closure (set once, never changes after boundary drawn).
  const handleBoundaryComplete = useCallback((polygon: GeoJSONPolygon) => {
    const map = mapRef.current
    if (!map) return
    setBoundary(polygon)
    setActiveTool(null)
    setIsTransitioning(true)
    map.setStyle(WARM_STYLE)
    map.once('style.load', () => {
      addBoundaryLayer(map, polygon)
      if (zonesRef.current.length > 0) updateZoneLayers(map, zonesRef.current)
      setIsTransitioning(false)
    })
  }, [])

  // Stable — reads zones and selectedType through refs, never stale.
  const handleZoneComplete = useCallback((polygon: GeoJSONPolygon) => {
    const map = mapRef.current
    if (!map) return
    const currentZones = zonesRef.current
    const currentType = selectedTypeRef.current
    const newZone: Zone = {
      id: crypto.randomUUID(),
      gardenId: 'local',
      type: currentType,
      label: generateZoneLabel(currentZones, currentType),
      boundary: polygon,
    }
    addZone(newZone)
    updateZoneLayers(map, [...currentZones, newZone])
  }, [addZone])

  const { isDrawing, startBoundary, startZone, stopZoneDrawing, undoLastPoint } =
    useDrawTool(mapRef, {
      onBoundaryComplete: handleBoundaryComplete,
      onZoneComplete: handleZoneComplete,
    })

  const handleToolSelect = useCallback((tool: ActiveTool) => {
    if (tool === activeTool) {
      if (tool === 'zones') stopZoneDrawing()
      setActiveTool(null)
      return
    }
    if (activeTool === 'zones') stopZoneDrawing()
    setActiveTool(tool)
    if (tool === 'boundary') startBoundary()
    if (tool === 'zones') startZone()
  }, [activeTool, startBoundary, startZone, stopZoneDrawing])

  const handleMapReady = useCallback((map: MapboxMap) => {
    mapRef.current = map
  }, [])

  const handleDeleteZone = useCallback((id: string) => {
    removeZone(id)
    const map = mapRef.current
    // Compute expected post-delete array from the ref (state update is async).
    if (map) updateZoneLayers(map, zonesRef.current.filter((z) => z.id !== id))
  }, [removeZone])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapCanvas onMapReady={handleMapReady} />

      {isTransitioning && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ backgroundColor: '#f4faff', animation: 'flash-fade 500ms ease-out forwards' }}
        />
      )}

      <div className="pointer-events-none absolute inset-0">
        <Header hasBoundary={!!boundary} />
        <ToolStrip
          activeTool={activeTool}
          hasBoundary={!!boundary}
          isDrawing={isDrawing}
          onToolSelect={handleToolSelect}
          onUndoLastPoint={undoLastPoint}
        />
        <ResultsCard />
        <SunTimeline />

        {activeTool === 'zones' && boundary && (
          <ZonePanel
            zones={zones}
            selectedType={selectedType}
            selectedZoneId={selectedZoneId}
            onSelectType={setSelectedType}
            onSelectZone={selectZone}
            onDeleteZone={handleDeleteZone}
          />
        )}
      </div>
    </div>
  )
}

export default App
