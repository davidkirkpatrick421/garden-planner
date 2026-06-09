// Full-bleed map with floating UI layered over it (DESIGN.md layout model:
// z-0 map base, z-40 panels, z-50 header). Panels are stubs for now; only the
// map is live. The wrapper is pointer-events-none so the map stays interactive;
// each panel re-enables pointer-events on itself.
import { MapCanvas } from './components/MapCanvas'
import { Header } from './components/Header'
import { ToolStrip } from './components/ToolStrip'
import { SunTimeline } from './components/SunTimeline'
import { ResultsCard } from './components/ResultsCard'

function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapCanvas />

      <div className="pointer-events-none absolute inset-0">
        <Header />
        <ToolStrip />
        <ResultsCard />
        <SunTimeline />
        {/* ObstaclePanel / ZonePanel / PlantPanel mount conditionally once the
            tool system is wired — omitted from the default view for now. */}
      </div>
    </div>
  )
}

export default App
