import { useState, useEffect, useRef } from 'react'
import styles from './CityPicker.module.css'
import { CITY_KEYS } from '../data/cities'

// Maps Nominatim city names → CalRecycle jurisdiction names where they differ.
// Add an entry here when searching a city shows it greyed-out despite having data.
const NOMINATIM_TO_CALRECYCLE = {
  'Ventura|CA':  'San Buenaventura|CA',
  'Carmel|CA':   'Carmel-by-the-Sea|CA',
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
    </svg>
  )
}

/**
 * CityPicker — inline variant
 *
 * Renders as a large bold city name with a subtle border + chevron.
 * Clicking it opens a Nominatim-backed search dropdown.
 *
 * Props:
 *   value        — { city, state, key } | null
 *   onChange     — (cityObj | null) => void
 *   excludeCity  — city object to suppress from results (prevents self-compare)
 *   openOnMount  — open the dropdown immediately (used when City B is first activated)
 *   onCloseEmpty — called when user dismisses without selecting (e.g. Escape with no value set)
 */
export default function CityPicker({ value, onChange, excludeCity, openOnMount, onCloseEmpty }) {
  const [open, setOpen]         = useState(openOnMount ?? false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // Focus the input whenever the dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

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

        setResults(mapped)
        setLoading(false)
        setActiveIdx(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setLoading(false)
      }
    }, 350)

    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  // Filter out the currently-selected city and the other picker's city
  const visible = results.filter(
    r => r.key !== value?.key && r.key !== excludeCity?.key
  )

  function handleTriggerClick() {
    setOpen(v => !v)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
  }

  function handleSelect(result) {
    onChange(result)
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(-1)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, visible.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = visible[activeIdx]
      if (target?.hasData) handleSelect(target)
    } else if (e.key === 'Escape') {
      setOpen(false)
      if (!value) onCloseEmpty?.()
    }
  }

  return (
    <div ref={containerRef} className={styles.picker}>
      {/* Trigger — big bold city name styled as a button */}
      <button
        className={`${styles.trigger} ${!value ? styles.triggerEmpty : ''}`}
        onClick={handleTriggerClick}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.cityName}>
          {value?.city ?? 'Choose a city'}
        </span>
        <span className={styles.triggerIcons}>
          <SearchIcon />
          <ChevronDown />
        </span>
      </button>

      {/* Search dropdown */}
      {open && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="Search cities…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {loading && (
            <p className={styles.meta}>Searching…</p>
          )}
          {!loading && query.length >= 2 && visible.length === 0 && (
            <p className={styles.meta}>No cities found</p>
          )}
          {!loading && query.length < 2 && (
            <p className={styles.meta}>Type to search cities…</p>
          )}

          {!loading && visible.map((r, i) => {
            const displayState = r.state || r.country?.toUpperCase()
            return (
              <button
                key={r.key}
                role="option"
                className={[
                  styles.option,
                  !r.hasData    ? styles.optionDisabled : '',
                  i === activeIdx ? styles.optionActive  : '',
                ].join(' ')}
                disabled={!r.hasData}
                onClick={() => r.hasData && handleSelect(r)}
              >
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
