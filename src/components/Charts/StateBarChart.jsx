import { useState, useMemo } from 'react'
import { MOCK_DATA } from '../../data/cities'
import styles from './StateBarChart.module.css'

const STATE_NAMES = {
  CA: 'California',
}

const AVAILABLE_STATES = [...new Set(Object.keys(MOCK_DATA).map(() => 'CA'))]

// Per-capita ranking — sorted highest to lowest
const CITIES_BY_CAPITA = Object.entries(MOCK_DATA)
  .filter(([, d]) => d.perCapita != null)
  .sort(([, a], [, b]) => b.perCapita - a.perCapita)
  .map(([name, d]) => ({ name, ...d }))

const MAX_CAPITA = CITIES_BY_CAPITA[0]?.perCapita ?? 1

// Total volume ranking — sorted highest to lowest
const CITIES_BY_VOLUME = Object.entries(MOCK_DATA)
  .filter(([, d]) => d.q1Total2024 != null)
  .sort(([, a], [, b]) => b.q1Total2024 - a.q1Total2024)
  .map(([name, d]) => ({ name, ...d }))

const MAX_VOLUME = CITIES_BY_VOLUME[0]?.q1Total2024 ?? 1

export default function StateBarChart({ cityObj, accentColor = 'var(--accent-color)' }) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [mode, setMode]                   = useState('perCapita')
  const [hoveredCity, setHoveredCity]     = useState(null)

  const effectiveState = cityObj?.state ?? selectedState
  const selectedName   = cityObj?.city ?? null

  const displayCity = hoveredCity ?? (selectedName ? MOCK_DATA[selectedName] && { name: selectedName, ...MOCK_DATA[selectedName] } : null)
  const hoverLabel  = displayCity
    ? mode === 'perCapita'
      ? `${displayCity.name} — ${displayCity.perCapita} lbs/person/day`
      : `${displayCity.name} — ${Math.round(displayCity.q1Total2024).toLocaleString()} tons`
    : null

  const sourceList = mode === 'perCapita' ? CITIES_BY_CAPITA : CITIES_BY_VOLUME
  const maxVal     = mode === 'perCapita' ? MAX_CAPITA : MAX_VOLUME

  const cities = useMemo(
    () => sourceList.filter(() => effectiveState === 'CA'),
    [sourceList, effectiveState]
  )

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <select
          className={styles.stateSelect}
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
        >
          {AVAILABLE_STATES.map(s => (
            <option key={s} value={s}>{STATE_NAMES[s] ?? s}</option>
          ))}
        </select>

        <div className={styles.tabGroup}>
          <button
            className={`${styles.tab} ${mode === 'perCapita' ? styles.tabActive : ''}`}
            onClick={() => setMode('perCapita')}
          >
            Per Capita
          </button>
          <button
            className={`${styles.tab} ${mode === 'volume' ? styles.tabActive : ''}`}
            onClick={() => setMode('volume')}
          >
            Total Volume
          </button>
        </div>
      </div>

      <div className={styles.hoverInfo}>{hoverLabel ?? ''}</div>

      <div className={styles.scrollContainer}>
        <div className={styles.chartInner}>
          <div className={styles.barTrack}>
            {cities.map(city => {
              const isSelected = city.name === selectedName
              const isHovered  = hoveredCity?.name === city.name
              const val        = mode === 'perCapita' ? city.perCapita : city.q1Total2024
              const heightPct  = val != null ? (val / maxVal) * 100 : 0

              return (
                <div
                  key={city.name}
                  className={styles.barCol}
                  title={
                    mode === 'perCapita'
                      ? `${city.name}: ${city.perCapita} lbs/person/day`
                      : `${city.name}: ${Math.round(city.q1Total2024).toLocaleString()} tons`
                  }
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <div
                    className={`${styles.bar} ${isSelected ? styles.barSelected : ''} ${isHovered && !isSelected ? styles.barHovered : ''}`}
                    style={{
                      height: `${heightPct}%`,
                      background: isSelected ? accentColor : undefined,
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className={styles.axisLine} />
        </div>
      </div>
    </div>
  )
}
