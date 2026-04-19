import { useState, useMemo } from 'react'
import { disposalByJurisdiction, populationData } from '../../data/cities'
import { useFilter } from '../../contexts/FilterContext'
import styles from './StateBarChart.module.css'

const STATE_NAMES = {
  CA: 'California',
}

const AVAILABLE_STATES = ['CA']

export default function StateBarChart({ cityObj, accentColor = 'var(--accent-color)' }) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [mode, setMode]                   = useState('perCapita')
  const [hoveredCity, setHoveredCity]     = useState(null)

  const { year, quarter } = useFilter()
  const qNum = parseInt(quarter.replace('Q', ''), 10)

  const effectiveState = cityObj?.state ?? selectedState
  const selectedName   = cityObj?.city ?? null

  const cities = useMemo(() => {
    const entries = []

    for (const [name, records] of Object.entries(disposalByJurisdiction)) {
      if (effectiveState !== 'CA') continue

      const record = records.find(r => r.year === year && r.quarter === qNum)
      if (!record || record.total == null) continue

      if (mode === 'perCapita') {
        const pop = populationData[name]?.pop?.[String(year)]
        if (!pop) continue
        const perCapita = +((record.total * 2000) / 91.25 / pop).toFixed(2)
        entries.push({ name, value: perCapita, total: record.total })
      } else {
        entries.push({ name, value: record.total, total: record.total })
      }
    }

    entries.sort((a, b) => b.value - a.value)
    return entries
  }, [year, qNum, mode, effectiveState])

  const maxVal = cities[0]?.value ?? 1

  const displayCity = hoveredCity ?? (selectedName ? cities.find(c => c.name === selectedName) ?? null : null)
  const hoverLabel  = displayCity
    ? mode === 'perCapita'
      ? `${displayCity.name} — ${displayCity.value} lbs/person/day`
      : `${displayCity.name} — ${Math.round(displayCity.value).toLocaleString()} tons`
    : null

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
            {cities.length === 0 ? (
              <div className={styles.noData}>No data for {quarter} {year}</div>
            ) : cities.map(city => {
              const isSelected = city.name === selectedName
              const isHovered  = hoveredCity?.name === city.name
              const heightPct  = (city.value / maxVal) * 100

              return (
                <div
                  key={city.name}
                  className={styles.barCol}
                  title={
                    mode === 'perCapita'
                      ? `${city.name}: ${city.value} lbs/person/day`
                      : `${city.name}: ${Math.round(city.value).toLocaleString()} tons`
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
