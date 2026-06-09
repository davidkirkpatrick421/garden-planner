import { useState, useRef, useEffect, useCallback } from 'react'
import type { Season } from '../types'
import { SEASONS } from '../lib/sunCalc'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface GeocodingFeature {
  place_name: string
  center: [number, number] // [lng, lat]
}

interface HeaderProps {
  hasBoundary: boolean
  isSatellite: boolean
  season: Season
  onLocationSelect: (lng: number, lat: number) => void
  onSeasonChange: (season: Season) => void
  onSatelliteToggle: () => void
}

export function Header({
  hasBoundary,
  isSatellite,
  season,
  onLocationSelect,
  onSeasonChange,
  onSatelliteToggle,
}: HeaderProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,locality,neighborhood`
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json() as { features: GeocodingFeature[] }
      setSuggestions(data.features ?? [])
      setIsOpen(true)
    } catch {
      // Network error — silently ignore, don't break the UI
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchSuggestions(val), 300)
  }

  function handleSelect(feature: GeocodingFeature) {
    const [lng, lat] = feature.center
    onLocationSelect(lng, lat)
    setQuery(feature.place_name)
    setIsOpen(false)
    setSuggestions([])
  }

  const pillCls = isSatellite
    ? 'border-white/15 bg-[rgba(22,20,16,0.82)] text-[rgba(245,240,232,0.9)]'
    : 'border-outline-variant/30 bg-surface/90 text-on-surface'

  const dividerCls = 'h-4 w-px bg-current opacity-20 shrink-0'

  return (
    <header
      className={`pointer-events-auto absolute left-1/2 top-3.5 z-50 flex h-12 -translate-x-1/2 items-center gap-3 rounded-full border px-5 shadow-[0_8px_24px_rgba(28,26,23,0.14),0_0_0_1px_rgba(28,26,23,0.06)] backdrop-blur-md ${pillCls}`}
    >
      {/* Logo */}
      <span className="font-display text-base font-extrabold whitespace-nowrap">
        Garden&nbsp;Sun
      </span>

      <div className={dividerCls} />

      {/* Address search */}
      <div ref={searchRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search your address…"
          className={`w-52 border-none bg-transparent font-body text-sm outline-none ring-0 focus:outline-none focus:ring-0 placeholder:opacity-40 ${isSatellite ? 'text-[rgba(245,240,232,0.9)]' : 'text-on-surface'}`}
        />

        {isOpen && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-[0_8px_24px_rgba(28,26,23,0.14)]">
            {suggestions.map((f, i) => (
              <li key={i}>
                <button
                  onMouseDown={() => handleSelect(f)}
                  className="w-full px-4 py-2.5 text-left font-body text-sm text-on-surface hover:bg-surface-container-high"
                >
                  {f.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Season picker + satellite toggle — only after boundary drawn */}
      {hasBoundary && (
        <>
          <div className={dividerCls} />

          <div className="flex items-center gap-1">
            {SEASONS.map((s) => {
              const active = season === s.season
              return (
                <button
                  key={s.season}
                  onClick={() => onSeasonChange(s.season)}
                  title={s.label}
                  className={`rounded-full px-3 py-1 font-body text-xs font-medium transition-colors ${
                    active
                      ? isSatellite
                        ? 'bg-white/15 text-[rgba(245,240,232,0.9)]'
                        : 'bg-primary text-on-primary'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  {s.emoji} <span className="hidden sm:inline">{s.season === 'spring-autumn' ? 'Spring' : s.season.charAt(0).toUpperCase() + s.season.slice(1)}</span>
                </button>
              )
            })}
          </div>

          <div className={dividerCls} />

          <button
            onClick={onSatelliteToggle}
            className={`rounded-full px-3 py-1 font-body text-xs font-medium transition-colors ${
              isSatellite
                ? 'bg-white/15 text-[rgba(245,240,232,0.9)]'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Satellite
          </button>
        </>
      )}
    </header>
  )
}
