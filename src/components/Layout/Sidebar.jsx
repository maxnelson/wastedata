import { useState } from 'react'
import styles from './Sidebar.module.css'

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

function SectionLabel({ children, style }) {
  return <p className={styles.label} style={style}>{children}</p>
}

export default function Sidebar() {
  const [year,    setYear]    = useState(2024)
  const [quarter, setQuarter] = useState('Q1')

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>

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

      </div>
    </aside>
  )
}
