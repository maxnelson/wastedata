import styles from './Sidebar.module.css'
import { useFilter } from '../../contexts/FilterContext'
import { useAppData } from '../../contexts/DataContext'

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

function SectionLabel({ children, style }) {
  return <p className={styles.label} style={style}>{children}</p>
}

export default function Sidebar() {
  const { quartersWithData } = useAppData()
  const { year, quarter, setYear, setQuarter } = useFilter()

  const availableQNums = quartersWithData[year] ?? new Set()

  function handleYearChange(newYear) {
    setYear(newYear)
    const available = quartersWithData[newYear] ?? new Set()
    const currentQNum = parseInt(quarter.replace('Q', ''), 10)
    if (!available.has(currentQNum)) {
      // Snap to the first available quarter for this year
      const firstAvailable = [1, 2, 3, 4].find(q => available.has(q))
      if (firstAvailable) setQuarter(`Q${firstAvailable}`)
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>

        {/* ── Time period ──────────────────────────────── */}
        <div className={styles.section}>
          <SectionLabel>Year</SectionLabel>
          <select
            className={styles.select}
            value={year}
            onChange={e => handleYearChange(Number(e.target.value))}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <SectionLabel style={{ marginTop: 'var(--space-4)' }}>Quarter</SectionLabel>
          <div className={styles.pillGroup}>
            {QUARTERS.map(q => {
              const qNum = parseInt(q.replace('Q', ''), 10)
              const disabled = !availableQNums.has(qNum)
              return (
                <button
                  key={q}
                  className={`${styles.pill} ${quarter === q ? styles.pillActive : ''} ${disabled ? styles.pillDisabled : ''}`}
                  onClick={() => !disabled && setQuarter(q)}
                  disabled={disabled}
                  aria-disabled={disabled}
                >
                  {q}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </aside>
  )
}
