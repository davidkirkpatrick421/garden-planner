// The Mapbox map — live, working component.
// Starts at the default location; GeolocateControl flies to the user's actual
// position after map load. Falls back gracefully if geolocation is denied.
//
// Why GeolocateControl instead of navigator.geolocation directly:
//   - Chrome doesn't persist geolocation permissions for HTTP origins, so
//     navigator.getCurrentPosition re-prompts on every page load.
//   - The 5 s timeout fires before the user clicks "Allow" in the dialog,
//     silently falling back to the default location.
//   - GeolocateControl handles these browser quirks and StrictMode correctly.
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { DEFAULT_LOCATION, DEFAULT_ZOOM } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

interface MapCanvasProps {
  onMapReady?: (map: mapboxgl.Map) => void
}

export function MapCanvas({ onMapReady }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  // StrictMode double-invokes effects in dev — guard so the map inits once.
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    if (!containerRef.current) return
    if (!MAPBOX_TOKEN) return
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
    onMapReady?.(map)

    // Zoom + compass controls — always visible, bottom-right.
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    // Geolocation — fires automatically on load; button stays as manual fallback.
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      fitBoundsOptions: { zoom: DEFAULT_ZOOM },
      trackUserLocation: false,
      showUserLocation: false,
    })
    map.addControl(geolocate, 'bottom-right')
    map.once('load', () => geolocate.trigger())

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
