import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
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

function CityPicker({ value, onChange, side }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = CITIES.filter(
    c => c.toLowerCase().includes(query.toLowerCase()) && c !== value
  )

  return (
    <div className={`${styles.cityPicker} ${styles[`cityPicker_${side}`]}`}>
      <button
        className={styles.cityPickerTrigger}
        onClick={() => setOpen(v => !v)}
      >
        <SearchIcon />
        <span className={styles.cityName}>{value}</span>
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
          {filtered.map(c => (
            <button
              key={c}
              className={styles.cityOption}
              onClick={() => { onChange(c); setOpen(false); setQuery('') }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppHeader({ cityA, cityB, onCityAChange, onCityBChange, onAddCompare }) {
  const { theme, setTheme, themes } = useTheme()
  const [designOpen, setDesignOpen] = useState(false)
  const activeTheme = themes.find(t => t.id === theme) || themes[0]
  const comparing = cityB !== null

  return (
    <header className={styles.header}>

      {/* Logo */}
      <div className={styles.logo}>
        <svg className={styles.logoMark} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path
            d="M14 6c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          />
          <path
            d="M14 6l-2.5 3M14 6l2.5 3"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
        <span className={styles.logoName}>TrashData</span>
        <span className={styles.logoRegion}>California</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <a href="/" className={`${styles.navLink} ${styles.navLinkActive}`}>Dashboard</a>
      </nav>

      {/* City controls — single or comparison */}
      <div className={styles.compare}>
        <CityPicker value={cityA} onChange={onCityAChange} side="a" />

        {comparing ? (
          /* Comparison mode: VS + city B picker + close */
          <>
            <span className={styles.vsChip}>VS</span>
            <CityPicker value={cityB} onChange={onCityBChange} side="b" />
            <button
              className={styles.closeCompareBtn}
              onClick={() => onCityBChange(null)}
              title="Close comparison"
            >
              ✕
            </button>
          </>
        ) : (
          /* Single mode: prominent add-comparison button */
          <button className={styles.addCompareBtn} onClick={onAddCompare}>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5z" />
            </svg>
            Compare
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className={styles.actions}>

        {/* Design system switcher */}
        <div className={styles.designSwitcher}>
          <button
            className={styles.designBtn}
            onClick={() => setDesignOpen(v => !v)}
          >
            <span>{activeTheme.emoji}</span>
            <span className={styles.designLabel}>{activeTheme.label}</span>
            <ChevronDown />
          </button>
          {designOpen && (
            <div className={styles.designMenu}>
              <p className={styles.designMenuLabel}>Design System</p>
              {themes.map(t => (
                <button
                  key={t.id}
                  className={`${styles.designOption} ${theme === t.id ? styles.designOptionActive : ''}`}
                  onClick={() => { setTheme(t.id); setDesignOpen(false) }}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                  {theme === t.id && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GitHub */}
        <a
          href="https://github.com"
          className={styles.ghBtn}
          target="_blank"
          rel="noreferrer"
        >
          <svg className={styles.ghIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </a>
      </div>

    </header>
  )
}
