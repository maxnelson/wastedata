import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/pro-regular-svg-icons'
import styles from './AppHeader.module.css'
import { CITY_KEYS } from '../../data/cities'

// Maps Nominatim city names → CalRecycle jurisdiction names where they differ.
// Add an entry here when searching a city shows it greyed-out despite having data.
const NOMINATIM_TO_CALRECYCLE = {
  'Ventura|CA':  'San Buenaventura|CA',
  'Carmel|CA':   'Carmel-by-the-Sea|CA',
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
    </svg>
  )
}

/**
 * CityPicker
 *  value        — { city, state, key } object, or null for unset state
 *  onChange     — (cityObj | null) => void
 *  side         — 'a' | 'b' — drives color tokens
 *  placeholder  — text shown when value is null
 *  excludeCity  — city object to exclude from results (prevents self-compare)
 *
 * Searches cities via OpenStreetMap Nominatim. Results from all jurisdictions
 * are shown; only cities with app data are enabled/selectable.
 */
function CityPicker({ value, onChange, side, placeholder, excludeCity }) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)

  const isSet = value !== null

  // Close dropdown when clicking outside the component
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

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

        const res = await fetch(url.toString(), { signal: controller.signal })
        const data = await res.json()

        const seen = new Set()
        const mapped = data
          .map(item => {
            const addr = item.address || {}
            const city = addr.city || addr.town || addr.village || addr.municipality
            if (!city) return null
            // Nominatim uses ISO3166-2-lvl4 (e.g. "US-CA") rather than a bare state_code field
            const isoLvl4  = addr['ISO3166-2-lvl4'] || ''
            const stateCode = isoLvl4.includes('-') ? isoLvl4.split('-')[1].toUpperCase() : null
            const country   = addr.country_code?.toLowerCase() || 'us'
            const key = stateCode ? `${city}|${stateCode}` : `${city}|${country.toUpperCase()}`
            if (seen.has(key)) return null
            seen.add(key)
            const resolvedKey = NOMINATIM_TO_CALRECYCLE[key] ?? key
            const hasData = CITY_KEYS.has(resolvedKey)
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

  // Exclude the currently-selected city and the other picker's selection
  const visible = results.filter(
    r => r.key !== value?.key && r.key !== excludeCity?.key
  )

  function handleOpen() {
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
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.cityPicker} ${styles[`cityPicker_${side}`]} ${!isSet ? styles.cityPickerUnset : ''}`}
    >
      <button className={styles.cityPickerTrigger} onClick={handleOpen}>
        {isSet && <SearchIcon />}
        <span className={`${styles.cityName} ${!isSet ? styles.cityNamePlaceholder : ''}`}>
          {isSet ? value.city : placeholder}
        </span>
        <ChevronDown />
      </button>

      {open && (
        <div className={styles.cityDropdown}>
          <input
            autoFocus
            className={styles.cityDropdownInput}
            placeholder="Search cities…"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
            onKeyDown={handleKeyDown}
          />

          {loading && (
            <p className={styles.cityDropdownMeta}>Searching…</p>
          )}

          {!loading && query.length >= 2 && visible.length === 0 && (
            <p className={styles.cityDropdownMeta}>No cities found</p>
          )}

          {!loading && query.length < 2 && (
            <p className={styles.cityDropdownMeta}>Type to search cities…</p>
          )}

          {!loading && visible.map((r, i) => {
            const displayState = r.state || r.country?.toUpperCase()
            return (
              <button
                key={r.key}
                className={[
                  styles.cityOption,
                  !r.hasData  ? styles.cityOptionDisabled : '',
                  i === activeIdx ? styles.cityOptionActive  : '',
                ].join(' ')}
                disabled={!r.hasData}
                onClick={() => r.hasData && handleSelect(r)}
              >
                <span className={styles.cityOptionName}>{r.city}</span>
                <span className={styles.cityOptionMeta}>{displayState}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AppHeader({ cityA, cityB, onCityAChange, onCityBChange }) {
  return (
    <header className={styles.header}>

      {/* Logo */}
      <div className={styles.logo}>
        <FontAwesomeIcon icon={faTrashCan} className={styles.logoMark} />
        <span className={styles.logoName}>WasteData</span>
      </div>

      {/* City controls — always two pickers, B starts as placeholder */}
      <div className={styles.compare}>
        <CityPicker
          value={cityA}
          onChange={onCityAChange}
          side="a"
          excludeCity={cityB}
        />

        <span className={`${styles.delimiter} ${cityB ? styles.delimiterActive : ''}`}>↔</span>

        <CityPicker
          value={cityB}
          onChange={onCityBChange}
          side="b"
          placeholder="Choose a city"
          excludeCity={cityA}
        />

        {/* Always in DOM — fades in when cityB is set to avoid layout shift */}
        <button
          className={`${styles.closeCompareBtn} ${cityB ? styles.closeCompareBtnVisible : ''}`}
          onClick={() => onCityBChange(null)}
          tabIndex={cityB ? 0 : -1}
          aria-label="Clear comparison city"
        >
          ✕
        </button>
      </div>

    </header>
  )
}
