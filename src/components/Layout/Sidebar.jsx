import { useState } from 'react'
import styles from './Sidebar.module.css'

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const VIEW_TYPES = [
  { value: 'combined',    label: 'All Waste',    hint: 'Commercial + residential' },
  { value: 'commercial',  label: 'Commercial',   hint: 'Businesses & institutions' },
  { value: 'residential', label: 'Residential',  hint: 'Single & multi-family' },
]

function SectionLabel({ children }) {
  return <p className={styles.label}>{children}</p>
}

function Divider() {
  return <div className={styles.divider} />
}

export default function Sidebar() {
  const [search,    setSearch]    = useState('')
  const [year,      setYear]      = useState(2024)
  const [quarter,   setQuarter]   = useState('Q1')
  const [viewType,  setViewType]  = useState('combined')
  const [perCapita, setPerCapita] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>

        {/* ── City search ─────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search 419 jurisdictions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Divider />

        {/* ── Time period ──────────────────────────────── */}
        <div className={styles.section}>
          <SectionLabel>Year</SectionLabel>
          <select
            className={styles.select}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <SectionLabel style={{ marginTop: 'var(--space-4)' }}>Quarter</SectionLabel>
          <div className={styles.pillGroup}>
            {QUARTERS.map(q => (
              <button
                key={q}
                className={`${styles.pill} ${quarter === q ? styles.pillActive : ''}`}
                onClick={() => setQuarter(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* ── View type ────────────────────────────────── */}
        <div className={styles.section}>
          <SectionLabel>Data View</SectionLabel>
          <div className={styles.radioGroup}>
            {VIEW_TYPES.map(vt => (
              <label key={vt.value} className={`${styles.radioLabel} ${viewType === vt.value ? styles.radioLabelActive : ''}`}>
                <input
                  type="radio"
                  name="viewType"
                  value={vt.value}
                  checked={viewType === vt.value}
                  onChange={() => setViewType(vt.value)}
                  className={styles.radioInput}
                />
                <div>
                  <span className={styles.radioText}>{vt.label}</span>
                  <span className={styles.radioHint}>{vt.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Divider />

        {/* ── Per-capita toggle ────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Per Capita</p>
              <p className={styles.toggleHint}>Show as lbs / person / day</p>
            </div>
            <button
              className={`${styles.toggle} ${perCapita ? styles.toggleOn : ''}`}
              onClick={() => setPerCapita(v => !v)}
              role="switch"
              aria-checked={perCapita}
              aria-label="Per capita mode"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        <Divider />

        {/* ── Data status ──────────────────────────────── */}
        <div className={styles.section}>
          <SectionLabel>Coverage</SectionLabel>
          <div className={styles.coverageBar}>
            <div className={styles.coverageFill} style={{ width: '1.7%' }} />
          </div>
          <p className={styles.coverageText}>1 of 58 counties downloaded</p>
        </div>

      </div>

    </aside>
  )
}
