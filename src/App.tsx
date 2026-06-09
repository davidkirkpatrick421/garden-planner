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
import type { GeoJSONPolygon, Season, Zone, ZoneType } from './types'
import { DEFAULT_ZOOM } from './types'

const WARM_STYLE = 'mapbox://styles/mapbox/standard'
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

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
  const [season, setSeason] = useState<Season>('summer')
  const [isSatellite, setIsSatellite] = useState(false)

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
  // Track boundary in a ref so satellite-toggle callback always has the latest value.
  const boundaryRef = useRef<GeoJSONPolygon | null>(null)

  // Stable — reads boundary via closure (set once, never changes after boundary drawn).
  const handleBoundaryComplete = useCallback((polygon: GeoJSONPolygon) => {
    const map = mapRef.current
    if (!map) return
    setBoundary(polygon)
    boundaryRef.current = polygon
    setActiveTool(null)
    setIsSatellite(false)
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

  const { isDrawing, startBoundary, startZone, cancelDrawing, undoLastPoint } =
    useDrawTool(mapRef, {
      onBoundaryComplete: handleBoundaryComplete,
      onZoneComplete: handleZoneComplete,
    })

  const handleToolSelect = useCallback((tool: ActiveTool) => {
    const isActiveDrawingTool = activeTool === 'boundary' || activeTool === 'zones'
    if (tool === activeTool) {
      if (isActiveDrawingTool) cancelDrawing()
      setActiveTool(null)
      return
    }
    if (isActiveDrawingTool) cancelDrawing()
    setActiveTool(tool)
    if (tool === 'boundary') startBoundary()
    if (tool === 'zones') startZone()
  }, [activeTool, startBoundary, startZone, cancelDrawing])

  const handleMapReady = useCallback((map: MapboxMap) => {
    mapRef.current = map
  }, [])

  const handleDeleteZone = useCallback((id: string) => {
    removeZone(id)
    const map = mapRef.current
    // Compute expected post-delete array from the ref (state update is async).
    if (map) updateZoneLayers(map, zonesRef.current.filter((z) => z.id !== id))
  }, [removeZone])

  const handleLocationSelect = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, duration: 1500 })
  }, [])

  const handleSeasonChange = useCallback((s: Season) => {
    setSeason(s)
    // TODO: trigger heat map recalculation when heat map is wired
  }, [])

  const handleSatelliteToggle = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (isSatellite) {
      setIsSatellite(false)
      setIsTransitioning(true)
      map.setStyle(WARM_STYLE)
      map.once('style.load', () => {
        const b = boundaryRef.current
        if (b) addBoundaryLayer(map, b)
        if (zonesRef.current.length > 0) updateZoneLayers(map, zonesRef.current)
        setIsTransitioning(false)
      })
    } else {
      setIsSatellite(true)
      map.setStyle(SATELLITE_STYLE)
      map.once('style.load', () => {
        const b = boundaryRef.current
        if (b) addBoundaryLayer(map, b)
        if (zonesRef.current.length > 0) updateZoneLayers(map, zonesRef.current)
      })
    }
  }, [isSatellite])

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
        <Header
          hasBoundary={!!boundary}
          isSatellite={isSatellite}
          season={season}
          onLocationSelect={handleLocationSelect}
          onSeasonChange={handleSeasonChange}
          onSatelliteToggle={handleSatelliteToggle}
        />
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
