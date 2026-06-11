import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapCanvas } from './components/MapCanvas'
import { Header } from './components/Header'
import { ToolStrip } from './components/ToolStrip'
import { SunTimeline } from './components/SunTimeline'
import { ResultsCard } from './components/ResultsCard'
import { ZonePanel } from './components/ZonePanel'
import { ObstaclePanel } from './components/ObstaclePanel'
import { useDrawTool } from './hooks/useDrawTool'
import { useZones } from './hooks/useZones'
import { useObstacles } from './hooks/useObstacles'
import { useHeatMap } from './hooks/useHeatMap'
import { addBoundaryLayer, updateZoneLayers, updateObstacleLayers } from './lib/mapLayers'
import { polygonCentroid } from './lib/heatMap'
import type { LatLng } from './lib/sunCalc'
import type { GeoJSONPolygon, GeoJSONLineString, Obstacle, ObstacleType, Season, Zone, ZoneType } from './types'
import { DEFAULT_LOCATION, DEFAULT_ZOOM } from './types'

const WARM_STYLE = 'mapbox://styles/mapbox/standard'
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

type ActiveTool = 'boundary' | 'zones' | 'obstacles' | 'plants' | null

const OBSTACLE_LABELS: Record<ObstacleType, string> = {
  fence: 'Fence', wall: 'Wall', hedge: 'Hedge', tree: 'Tree',
  pergola: 'Pergola', shed: 'Shed', summerhouse: 'Summerhouse', arch: 'Arch',
  'raised-bed-feature': 'Raised bed', patio: 'Patio', pond: 'Pond',
  furniture: 'Furniture', compost: 'Compost', 'cold-frame': 'Cold frame',
}

const SHADE_CASTING = new Set<ObstacleType>([
  'fence', 'wall', 'hedge', 'tree', 'pergola', 'shed', 'summerhouse', 'arch',
])

function generateZoneLabel(zones: Zone[], type: ZoneType): string {
  const typeLabels: Record<ZoneType, string> = {
    'raised-bed': 'Raised bed', 'open-bed': 'Open bed', patio: 'Patio',
    lawn: 'Lawn', greenhouse: 'Greenhouse', pond: 'Pond',
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
  const [location, setLocation] = useState<LatLng>(DEFAULT_LOCATION)

  const {
    zones, selectedType, selectedZoneId,
    setSelectedType, addZone, removeZone, selectZone,
  } = useZones()

  const { obstacles, addObstacle, removeObstacle } = useObstacles()

  const { sunHoursByZone } = useHeatMap({
    boundary,
    zones,
    obstacles,
    season,
    location,
  })

  // Always-current refs — stable callbacks read state without being recreated.
  const zonesRef = useRef<Zone[]>(zones)
  zonesRef.current = zones
  const selectedTypeRef = useRef<ZoneType>(selectedType)
  selectedTypeRef.current = selectedType
  const boundaryRef = useRef<GeoJSONPolygon | null>(null)
  const sunHoursByZoneRef = useRef<Map<string, number>>(sunHoursByZone)
  sunHoursByZoneRef.current = sunHoursByZone
  const obstaclesRef = useRef<Obstacle[]>(obstacles)
  obstaclesRef.current = obstacles
  // Stores type+height chosen in ObstaclePanel before the draw starts.
  const pendingObstacleRef = useRef<{ type: ObstacleType; heightMetres: number } | null>(null)

  // Re-colour zone layers whenever heat map results arrive.
  useEffect(() => {
    const map = mapRef.current
    if (!map || zonesRef.current.length === 0) return
    if (!map.getSource('garden-zones')) return
    updateZoneLayers(map, zonesRef.current, sunHoursByZone)
  }, [sunHoursByZone])

  // ── Draw callbacks (stable) ────────────────────────────────────────────────

  const handleBoundaryComplete = useCallback((polygon: GeoJSONPolygon) => {
    const map = mapRef.current
    if (!map) return
    const [lng, lat] = polygonCentroid(polygon)
    setBoundary(polygon)
    boundaryRef.current = polygon
    setLocation({ lat, lng })
    setActiveTool(null)
    setIsSatellite(false)
    setIsTransitioning(true)
    map.setStyle(WARM_STYLE)
    map.once('style.load', () => {
      addBoundaryLayer(map, polygon)
      if (zonesRef.current.length > 0)
        updateZoneLayers(map, zonesRef.current, sunHoursByZoneRef.current)
      if (obstaclesRef.current.length > 0)
        updateObstacleLayers(map, obstaclesRef.current)
      setIsTransitioning(false)
    })
  }, [])

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
    updateZoneLayers(map, [...currentZones, newZone], sunHoursByZoneRef.current)
  }, [addZone])

  const handleObstacleComplete = useCallback(
    (geometry: GeoJSONPolygon | GeoJSONLineString) => {
      const pending = pendingObstacleRef.current
      if (!pending) return
      const newObstacle: Obstacle = {
        id: crypto.randomUUID(),
        gardenId: 'local',
        type: pending.type,
        category: SHADE_CASTING.has(pending.type) ? 'shade-casting' : 'feature',
        geometry,
        heightMetres: pending.heightMetres,
        label: OBSTACLE_LABELS[pending.type],
      }
      pendingObstacleRef.current = null
      addObstacle(newObstacle)
      const map = mapRef.current
      if (map) updateObstacleLayers(map, [...obstaclesRef.current, newObstacle])
    },
    [addObstacle],
  )

  const { isDrawing, startBoundary, startZone, startObstacle, cancelDrawing, undoLastPoint } =
    useDrawTool(mapRef, {
      onBoundaryComplete: handleBoundaryComplete,
      onZoneComplete: handleZoneComplete,
      onObstacleComplete: handleObstacleComplete,
    })

  // ── Tool selection ─────────────────────────────────────────────────────────

  const handleToolSelect = useCallback((tool: ActiveTool) => {
    const isActiveDrawingTool =
      activeTool === 'boundary' || activeTool === 'zones' || activeTool === 'obstacles'
    if (tool === activeTool) {
      if (isActiveDrawingTool) cancelDrawing()
      setActiveTool(null)
      return
    }
    if (isActiveDrawingTool) cancelDrawing()
    setActiveTool(tool)
    if (tool === 'boundary') startBoundary()
    if (tool === 'zones') startZone()
    // obstacles: drawing starts from the panel's "Draw on map" button, not here
  }, [activeTool, startBoundary, startZone, cancelDrawing])

  // Called by ObstaclePanel's "Draw on map" button.
  const handleStartObstacleDraw = useCallback(
    (type: ObstacleType, heightMetres: number, drawMode: 'draw_line_string' | 'draw_polygon') => {
      pendingObstacleRef.current = { type, heightMetres }
      startObstacle(drawMode)
    },
    [startObstacle],
  )

  const handleMapReady = useCallback((map: MapboxMap) => {
    mapRef.current = map
  }, [])

  const handleDeleteZone = useCallback((id: string) => {
    removeZone(id)
    const map = mapRef.current
    if (map) updateZoneLayers(map, zonesRef.current.filter((z) => z.id !== id), sunHoursByZoneRef.current)
  }, [removeZone])

  const handleDeleteObstacle = useCallback((id: string) => {
    removeObstacle(id)
    const map = mapRef.current
    if (map) updateObstacleLayers(map, obstaclesRef.current.filter((o) => o.id !== id))
  }, [removeObstacle])

  const handleLocationSelect = useCallback((lng: number, lat: number) => {
    setLocation({ lat, lng })
    mapRef.current?.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM, duration: 1500 })
  }, [])

  const handleSeasonChange = useCallback((s: Season) => { setSeason(s) }, [])

  const handleSatelliteToggle = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const readdLayers = () => {
      const b = boundaryRef.current
      if (b) addBoundaryLayer(map, b)
      if (zonesRef.current.length > 0)
        updateZoneLayers(map, zonesRef.current, sunHoursByZoneRef.current)
      if (obstaclesRef.current.length > 0)
        updateObstacleLayers(map, obstaclesRef.current)
    }
    if (isSatellite) {
      setIsSatellite(false)
      setIsTransitioning(true)
      map.setStyle(WARM_STYLE)
      map.once('style.load', () => { readdLayers(); setIsTransitioning(false) })
    } else {
      setIsSatellite(true)
      map.setStyle(SATELLITE_STYLE)
      map.once('style.load', readdLayers)
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
        <ResultsCard zones={zones} sunHoursByZone={sunHoursByZone} season={season} />
        <SunTimeline />

        {activeTool === 'zones' && boundary && (
          <ZonePanel
            zones={zones}
            selectedType={selectedType}
            selectedZoneId={selectedZoneId}
            sunHoursByZone={sunHoursByZone}
            onSelectType={setSelectedType}
            onSelectZone={selectZone}
            onDeleteZone={handleDeleteZone}
          />
        )}

        {activeTool === 'obstacles' && boundary && (
          <ObstaclePanel
            obstacles={obstacles}
            season={season}
            location={location}
            isDrawing={isDrawing}
            onStartDraw={handleStartObstacleDraw}
            onDeleteObstacle={handleDeleteObstacle}
          />
        )}
      </div>
    </div>
  )
}

export default App
