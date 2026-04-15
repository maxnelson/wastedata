import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/pro-regular-svg-icons'
import styles from './AppHeader.module.css'

const CITIES = [
  'Berkeley', 'Oakland', 'San Francisco', 'Alameda',
  'Fremont', 'Hayward', 'San Leandro', 'Livermore',
]

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
 *  value        — selected city string, or null for unset state
 *  onChange     — (city: string | null) => void
 *  side         — 'a' | 'b' — drives color tokens
 *  placeholder  — text shown when value is null
 *  excludeCity  — city name to hide from the option list (prevents self-compare)
 */
function CityPicker({ value, onChange, side, placeholder, excludeCity }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const isSet = value !== null

  const options = CITIES.filter(c => {
    const matchesQuery = c.toLowerCase().includes(query.toLowerCase())
    const notSelf = c !== value
    const notExcluded = c !== excludeCity
    return matchesQuery && notSelf && notExcluded
  })

  return (
    <div className={`${styles.cityPicker} ${styles[`cityPicker_${side}`]} ${!isSet ? styles.cityPickerUnset : ''}`}>
      <button
        className={styles.cityPickerTrigger}
        onClick={() => setOpen(v => !v)}
      >
        {isSet && <SearchIcon />}
        <span className={`${styles.cityName} ${!isSet ? styles.cityNamePlaceholder : ''}`}>
          {isSet ? value : placeholder}
        </span>
        <ChevronDown />
      </button>
      {open && (
        <div className={styles.cityDropdown}>
          <input
            autoFocus
            className={styles.cityDropdownInput}
            placeholder="Search cities..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {options.map(c => (
            <button
              key={c}
              className={styles.cityOption}
              onClick={() => { onChange(c); setOpen(false); setQuery('') }}
            >
              {c}
            </button>
          ))}
          {options.length === 0 && (
            <p className={styles.cityOptionEmpty}>No cities found</p>
          )}
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
        <span className={styles.logoRegion}>California</span>
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
