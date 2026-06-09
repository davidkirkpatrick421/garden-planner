import { useCallback, useRef, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { MapCanvas } from './components/MapCanvas'
import { Header } from './components/Header'
import { ToolStrip } from './components/ToolStrip'
import { SunTimeline } from './components/SunTimeline'
import { ResultsCard } from './components/ResultsCard'
import { useDrawTool } from './hooks/useDrawTool'
import { addBoundaryLayer } from './lib/mapLayers'
import type { GeoJSONPolygon } from './types'

const WARM_STYLE = 'mapbox://styles/mapbox/standard'

type ActiveTool = 'boundary' | 'zones' | 'obstacles' | 'plants' | null

function App() {
  const mapRef = useRef<MapboxMap | null>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [boundary, setBoundary] = useState<GeoJSONPolygon | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleBoundaryComplete = useCallback(
    (polygon: GeoJSONPolygon) => {
      const map = mapRef.current
      if (!map) return

      setBoundary(polygon)
      setActiveTool(null)
      setIsTransitioning(true) // flash overlay appears

      map.setStyle(WARM_STYLE)

      // All user-added sources/layers are wiped on setStyle — re-add inside style.load.
      map.once('style.load', () => {
        addBoundaryLayer(map, polygon)
        setIsTransitioning(false) // flash fades out as warm style is revealed
      })
    },
    [],
  )

  const { isDrawing, startBoundary, undoLastPoint } = useDrawTool(mapRef, {
    onComplete: handleBoundaryComplete,
  })

  const handleToolSelect = useCallback(
    (tool: ActiveTool) => {
      setActiveTool(tool)
      if (tool === 'boundary') startBoundary()
    },
    [startBoundary],
  )

  const handleMapReady = useCallback((map: MapboxMap) => {
    mapRef.current = map
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapCanvas onMapReady={handleMapReady} />

      {/* Flash overlay — cream-coloured fade that bridges the style switch. */}
      {isTransitioning && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ backgroundColor: '#f4faff', animation: 'flash-fade 500ms ease-out forwards' }}
        />
      )}

      {/* Floating UI — pointer-events-none wrapper; each panel re-enables on itself. */}
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
      </div>
    </div>
  )
}

export default App
