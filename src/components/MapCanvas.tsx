// The Mapbox map. This is the live, working component — everything else is a
// stub. Renders a satellite map centred on Carrickfergus (CLAUDE.md "What to
// Build Next"). Satellite style is used during boundary drawing; the warm
// vector style switch happens later once drawing is wired up.
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { DEFAULT_LOCATION, DEFAULT_ZOOM } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  // StrictMode double-invokes effects in dev — guard so the map inits once.
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    if (!containerRef.current) return
    if (!MAPBOX_TOKEN) return // missing-token UI handled below
    initialised.current = true

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    })
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      initialised.current = false
    }
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 z-0 grid place-items-center bg-surface-dim p-8 text-center">
        <div className="max-w-md">
          <h2 className="font-display text-2xl font-bold text-on-surface">
            Mapbox token missing
          </h2>
          <p className="mt-2 font-body text-on-surface-variant">
            Add a public token to <code>.env.local</code> as{' '}
            <code>VITE_MAPBOX_TOKEN=pk.…</code> and restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="absolute inset-0 z-0" />
}
