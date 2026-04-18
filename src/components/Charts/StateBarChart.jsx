import { useState, useMemo } from 'react'
import { MOCK_DATA } from '../../data/cities'
import styles from './StateBarChart.module.css'

const STATE_NAMES = {
  CA: 'California',
  // additional states will populate here as data is added
}

// Derive available states from data keys (currently all CA)
const AVAILABLE_STATES = [...new Set(Object.keys(MOCK_DATA).map(() => 'CA'))]

// Build and sort all cities by perCapita descending — done once at module level
const ALL_CITIES = Object.entries(MOCK_DATA)
  .filter(([, d]) => d.perCapita != null)
  .sort(([, a], [, b]) => b.perCapita - a.perCapita)
  .map(([name, d]) => ({ name, ...d }))

const MAX_VAL = ALL_CITIES[0]?.perCapita ?? 1

/**
 * StateBarChart
 *
 * Horizontally scrollable bar chart showing per-capita waste (lbs/person/day)
 * for every city in the selected state, sorted highest to lowest.
 * The currently selected city is highlighted in the panel's accent color.
 *
 * Props:
 *   cityObj     — { city, state, key } | null
 *   accentColor — CSS color string for the highlighted bar
 */
export default function StateBarChart({ cityObj, accentColor = 'var(--accent-color)' }) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [hoveredCity, setHoveredCity]     = useState(null)

  // When cityObj changes city (panel navigates), keep state in sync
  const effectiveState = cityObj?.state ?? selectedState

  const cities = useMemo(
    () => ALL_CITIES.filter(() => effectiveState === 'CA'), // expand when multi-state data lands
    [effectiveState]
  )

  const selectedName = cityObj?.city ?? null

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.hoverInfo}>
          {hoveredCity
            ? <><strong>{hoveredCity.name}</strong> — {hoveredCity.perCapita} lbs/person/day</>
            : <span className={styles.hoverPlaceholder}>Hover a bar to see city details</span>
          }
        </div>
        <select
          className={styles.stateSelect}
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
        >
          {AVAILABLE_STATES.map(s => (
            <option key={s} value={s}>{STATE_NAMES[s] ?? s}</option>
          ))}
        </select>
      </div>

      <div className={styles.scrollContainer}>
        <div className={styles.chartInner}>
          <div className={styles.barTrack}>
            {cities.map(city => {
              const isSelected = city.name === selectedName
              const isHovered  = hoveredCity?.name === city.name
              const heightPct  = (city.perCapita / MAX_VAL) * 100

              return (
                <div
                  key={city.name}
                  className={styles.barCol}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <div
                    className={`${styles.bar} ${isSelected ? styles.barSelected : ''} ${isHovered ? styles.barHovered : ''}`}
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
