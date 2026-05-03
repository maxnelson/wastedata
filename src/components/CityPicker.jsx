import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import styles from './CityPicker.module.css'
import { useAppData } from '../contexts/DataContext'

// Maps Nominatim city names → CalRecycle jurisdiction names where they differ.
// Add an entry here when searching a city shows it greyed-out despite having data.
const NOMINATIM_TO_CALRECYCLE = {
  'Ventura|CA':  'San Buenaventura|CA',
  'Carmel|CA':   'Carmel-by-the-Sea|CA',
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" />
    </svg>
  )
}

/**
 * CityPicker — inline textarea variant
 *
 * The city name heading is itself a search textarea. Clicking places the cursor
 * and shows dropdown results immediately; typing filters them live.
 *
 * Props:
 *   value        — { city, state, key } | null
 *   onChange     — (cityObj | null) => void
 *   excludeCity  — city object to suppress from results (prevents self-compare)
 *   openOnMount  — open the dropdown immediately (used when City B is first activated)
 *   onCloseEmpty — called when user dismisses without selecting (e.g. Escape with no value set)
 */
export default function CityPicker({ value, onChange, excludeCity, openOnMount, onCloseEmpty }) {
  const { CITY_KEYS } = useAppData()
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // The value shown in the textarea: city name when closed, live query when open
  const displayValue = open ? query : (value?.city ?? '')

  // Auto-resize the textarea to fit its content (allows multi-line wrapping)
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [displayValue])

  // openOnMount: focus the textarea so the dropdown opens immediately
  useEffect(() => {
    if (openOnMount) inputRef.current?.focus()
  }, [openOnMount])

  // Close dropdown on outside click; if no value was ever set, collapse City B entirely
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
        setResults([])
        if (!value) onCloseEmpty?.()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open, value, onCloseEmpty])

  // Debounced Nominatim geo-lookup — fires 350ms after the user stops typing
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('q', query)
        url.searchParams.set('featuretype', 'city')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('format', 'json')
        url.searchParams.set('limit', '12')
        url.searchParams.set('accept-language', 'en')
        url.searchParams.set('countrycodes', 'us')

        const res  = await fetch(url.toString(), { signal: controller.signal })
        const data = await res.json()

        const seen   = new Set()
        const mapped = data
          .map(item => {
            const addr = item.address || {}
            const city = addr.city || addr.town || addr.village || addr.municipality
            if (!city) return null

            const isoLvl4   = addr['ISO3166-2-lvl4'] || ''
            const stateCode = isoLvl4.includes('-') ? isoLvl4.split('-')[1].toUpperCase() : null
            const country   = addr.country_code?.toLowerCase() || 'us'
            const key       = stateCode ? `${city}|${stateCode}` : `${city}|${country.toUpperCase()}`

            if (seen.has(key)) return null
            seen.add(key)

            const resolvedKey = NOMINATIM_TO_CALRECYCLE[key] ?? key
            const hasData     = CITY_KEYS.has(resolvedKey)
            return { city, state: stateCode, country, key: resolvedKey, hasData }
          })
          .filter(Boolean)
          .filter(r => r.state === 'CA')

        setResults(mapped)
        setLoading(false)
        setActiveIdx(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setLoading(false)
      }
    }, 350)

    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  // Filter out only the other picker's city; keep the currently-selected city so it shows with a checkmark
  const visible = results.filter(r => r.key !== excludeCity?.key)

  function handleFocus() {
    const initial = value?.city ?? ''
    setQuery(initial)
    setActiveIdx(-1)
    setOpen(true)
    // Kick off a search immediately using the current city name
    if (initial.length >= 2) setLoading(true)
    // Don't select all — browser places cursor at the click position naturally
  }

  // Handles Tab-key dismissal; mousedown listener handles click-outside
  function handleBlur(e) {
    if (containerRef.current?.contains(e.relatedTarget)) return
    setOpen(false)
    setQuery('')
    setResults([])
    if (!value) onCloseEmpty?.()
  }

  function handleSelect(result) {
    onChange(result)
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      // Never insert a newline; confirm the highlighted result if any
      e.preventDefault()
      const target = visible[activeIdx]
      if (target?.hasData) handleSelect(target)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, visible.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setResults([])
      if (!value) onCloseEmpty?.()
    }
  }

  return (
    <div ref={containerRef} className={styles.picker}>
      {/* City name — a textarea so long names wrap on small screens */}
      <textarea
        ref={inputRef}
        className={styles.cityInput}
        value={displayValue}
        placeholder="Choose a city"
        rows={1}
        aria-expanded={open}
        aria-haspopup="listbox"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
        onKeyDown={handleKeyDown}
      />

      {/* Results dropdown */}
      {open && (
        <div className={styles.dropdown} role="listbox">
          {loading && (
            <p className={styles.meta}>Searching…</p>
          )}
          {!loading && query.length >= 2 && visible.length === 0 && (
            <p className={styles.meta}>No cities found</p>
          )}

          {!loading && visible.map((r, i) => {
            const displayState = r.state || r.country?.toUpperCase()
            const isSelected   = r.key === value?.key
            return (
              <button
                key={r.key}
                role="option"
                aria-selected={isSelected}
                className={[
                  styles.option,
                  !r.hasData      ? styles.optionDisabled  : '',
                  isSelected      ? styles.optionSelected  : '',
                  i === activeIdx ? styles.optionActive    : '',
                ].join(' ')}
                disabled={!r.hasData}
                onPointerDown={e => e.preventDefault()}
                onClick={() => r.hasData && handleSelect(r)}
              >
                {isSelected && <span className={styles.optionCheck}><CheckIcon /></span>}
                <span className={styles.optionName}>{r.city}</span>
                <span className={styles.optionMeta}>{displayState}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
