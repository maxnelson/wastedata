import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import styles from './SocialLayout.module.css'

// Matches the shared --cat-* tokens so donut segments stay consistent
const CATEGORIES = [
  { name: 'Organic',          pct: 42, color: '#52b788' },
  { name: 'Paper',            pct: 24, color: '#4895ef' },
  { name: 'Plastic',          pct: 12, color: '#f77f00' },
  { name: 'Construction',     pct: 11, color: '#a07850' },
  { name: 'Metal',            pct:  3, color: '#8b9fa8' },
  { name: 'Residue',          pct:  3, color: '#6b7280' },
  { name: 'Special',          pct:  3, color: '#f4c430' },
  { name: 'Glass',            pct:  2, color: '#06b6d4' },
]

function buildConic(cats) {
  let deg = 0
  return `conic-gradient(${cats.map(c => {
    const s = deg
    deg += (c.pct / 100) * 360
    return `${c.color} ${s.toFixed(1)}deg ${deg.toFixed(1)}deg`
  }).join(', ')})`
}

const CITIES = ['Berkeley', 'Oakland', 'San Francisco', 'Alameda', 'Fremont', 'Hayward', 'San Leandro', 'Livermore']

const MOCK_DATA = {
  Berkeley:      { perCapita: 3.2, total: 48234, yoy: -2.1,  population: '124,321', county: 'Alameda' },
  Oakland:       { perCapita: 3.8, total: 156820, yoy: +0.4, population: '440,646', county: 'Alameda' },
  'San Francisco': { perCapita: 2.9, total: 204310, yoy: -3.3, population: '873,965', county: 'San Francisco' },
  Alameda:       { perCapita: 3.5, total: 26102,  yoy: +1.1, population: '79,827',  county: 'Alameda' },
  Fremont:       { perCapita: 3.1, total: 73450,  yoy: -0.8, population: '230,504', county: 'Alameda' },
  Hayward:       { perCapita: 4.0, total: 62110,  yoy: +2.2, population: '162,954', county: 'Alameda' },
  'San Leandro': { perCapita: 3.6, total: 31840,  yoy: +0.7, population: '90,161',  county: 'Alameda' },
  Livermore:     { perCapita: 3.3, total: 30210,  yoy: -1.5, population: '93,003',  county: 'Alameda' },
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
    </svg>
  )
}

function CitySearch({ value, onChange, side }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()) && c !== value)

  return (
    <div className={`${styles.citySearch} ${styles[`citySearch_${side}`]}`}>
      <button className={styles.citySearchTrigger} onClick={() => setOpen(v => !v)}>
        <SearchIcon />
        <span className={styles.citySearchLabel}>{value}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
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

function CityPanel({ city, side }) {
  const data = MOCK_DATA[city] || MOCK_DATA['Berkeley']
  const isGood = data.yoy < 0

  return (
    <div className={`${styles.panel} ${styles[`panel_${side}`]}`}>
      {/* City name */}
      <div className={styles.panelHeader}>
        <p className={styles.panelCounty}>{data.county} County</p>
        <h2 className={styles.panelCity}>{city}</h2>
        <p className={styles.panelPop}>Population {data.population}</p>
      </div>

      {/* Hero metric */}
      <div className={styles.heroMetric}>
        <span className={`${styles.heroNumber} num`}>{data.perCapita}</span>
        <div className={styles.heroLabels}>
          <span className={styles.heroUnit}>lbs</span>
          <span className={styles.heroDivider}>/</span>
          <span className={styles.heroUnit}>person</span>
          <span className={styles.heroDivider}>/</span>
          <span className={styles.heroUnit}>day</span>
        </div>
        <span
          className={`${styles.heroBadge} num`}
          style={{ color: isGood ? 'var(--status-positive)' : 'var(--status-negative)' }}
        >
          {isGood ? '↓' : '↑'} {Math.abs(data.yoy)}% vs last year
        </span>
      </div>

      {/* Donut */}
      <div className={styles.donutWrap}>
        <div className={styles.donutRing} style={{ background: buildConic(CATEGORIES) }} />
        <div className={styles.donutCenter}>
          <span className={`${styles.donutTotal} num`}>{(data.total / 1000).toFixed(0)}k</span>
          <span className={styles.donutUnit}>tons / quarter</span>
        </div>
      </div>

      {/* Top categories */}
      <div className={styles.breakdown}>
        {CATEGORIES.slice(0, 5).map(cat => (
          <div key={cat.name} className={styles.breakdownRow}>
            <span className={styles.breakdownName}>{cat.name}</span>
            <div className={styles.breakdownBar}>
              <div
                className={styles.breakdownFill}
                style={{ width: `${cat.pct}%`, background: cat.color }}
              />
            </div>
            <span className={`${styles.breakdownPct} num`}>{cat.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SocialLayout() {
  const [cityA, setCityA] = useState('Berkeley')
  const [cityB, setCityB] = useState('Oakland')
  const { setTheme } = useTheme()

  return (
    <div className={styles.root}>

      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <span className={styles.logoName}>TrashData</span>
          <span className={styles.logoDot}>·</span>
          <span className={styles.logoSub}>CA</span>
        </div>

        <div className={styles.headerControls}>
          <CitySearch value={cityA} onChange={setCityA} side="a" />
          <div className={styles.vsChip}>VS</div>
          <CitySearch value={cityB} onChange={setCityB} side="b" />
        </div>

        <div className={styles.headerActions}>
          <button className={styles.shareBtn}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.5 2.5 0 0 1 13 4.5z" />
            </svg>
            Share
          </button>
        </div>
      </header>

      {/* Comparison panels */}
      <main className={styles.comparison}>
        <CityPanel city={cityA} side="a" />

        <div className={styles.divider}>
          <span className={styles.vsBadge}>VS</span>
        </div>

        <CityPanel city={cityB} side="b" />
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Q1 2024 · CalRecycle disposal data · Estimates only</span>
        <span className={styles.footerSwitch}>
          <button className={styles.switchBtn} onClick={() => setTheme('analytical')}>
            Switch to Dashboard view →
          </button>
        </span>
      </footer>
    </div>
  )
}
