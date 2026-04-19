import { useState, useMemo, useRef, useEffect } from 'react'
import { disposalByJurisdiction, populationData } from '../../data/cities'
import { useFilter } from '../../contexts/FilterContext'
import { getCityColor } from '../../data/cityColorMap'
import styles from './StateBarChart.module.css'

const STATE_NAMES = { CA: 'California' }
const AVAILABLE_STATES = ['CA']

function toIdx(svg, clientX, len) {
  const rect = svg?.getBoundingClientRect()
  if (!rect || len === 0) return 0
  const pct = (clientX - rect.left) / rect.width
  return Math.max(0, Math.min(len - 1, Math.floor(pct * len)))
}

function getHeightPct(value, scaleMode, effectiveMax, capVal) {
  if (scaleMode === 'log')
    return (Math.log1p(value) / Math.log1p(effectiveMax)) * 100
  if (scaleMode === 'capped')
    return (Math.min(value, capVal) / capVal) * 100
  return (value / effectiveMax) * 100
}

export default function StateBarChart({ cityObj, accentColor = 'var(--accent-color)' }) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [mode, setMode]                   = useState('perCapita')
  const [hoveredCity, setHoveredCity]     = useState(null)
  const [scaleMode, setScaleMode]         = useState('normal')
  const [brushRange, setBrushRange]       = useState(null)  // { start, end } city indices
  const [dragPreview, setDragPreview]     = useState(null)

  const dragRef = useRef({ active: false })
  const svgRef  = useRef(null)

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

  // 98th percentile of the full dataset — stable anchor for Capped mode
  const capVal = useMemo(() => {
    if (cities.length === 0) return 1
    const sorted = [...cities].sort((a, b) => a.value - b.value)
    return sorted[Math.floor(0.98 * (sorted.length - 1))].value
  }, [cities])

  // Validate brushRange against current cities length to handle stale ranges
  const validBrush = brushRange && brushRange.end < cities.length ? brushRange : null

  // Brush-filtered subset; scale modes apply on top of this
  const visibleCities = useMemo(() => {
    if (!validBrush) return cities
    return cities.slice(validBrush.start, validBrush.end + 1)
  }, [cities, validBrush])

  const effectiveMax = visibleCities[0]?.value ?? 1

  const displayCity = hoveredCity ?? (selectedName ? visibleCities.find(c => c.name === selectedName) ?? null : null)
  const hoverLabel  = displayCity
    ? mode === 'perCapita'
      ? `${displayCity.name} — ${displayCity.value} lbs/person/day`
      : `${displayCity.name} — ${Math.round(displayCity.value).toLocaleString()} tons`
    : null

  // ── Brush interaction ────────────────────────────────────────
  // Handlers are created fresh per drag so they close over the correct
  // cities.length and svg ref at the moment dragging starts.
  function handleBrushMouseDown(e) {
    e.preventDefault()
    const svg       = svgRef.current
    const len       = cities.length
    const startIdx  = toIdx(svg, e.clientX, len)
    dragRef.current = { active: true }
    setDragPreview({ start: startIdx, end: startIdx })

    function onMove(ev) {
      const idx   = toIdx(svg, ev.clientX, len)
      const start = Math.min(startIdx, idx)
      const end   = Math.max(startIdx, idx)
      setDragPreview({ start, end })
    }
    function onUp(ev) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      dragRef.current.active = false
      dragRef.current.cleanup = null
      const idx   = toIdx(svg, ev.clientX, len)
      const start = Math.min(startIdx, idx)
      const end   = Math.max(startIdx, idx)
      setDragPreview(null)
      setBrushRange(end - start < 2 ? null : { start, end })
    }
    // Store cleanup fn so unmount can remove listeners if drag is in progress
    dragRef.current.cleanup = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  function handleBrushClear() { setBrushRange(null); setDragPreview(null) }

  useEffect(() => () => { dragRef.current.cleanup?.() }, [])

  // ── Mini chart values ────────────────────────────────────────
  const miniMaxVal = cities[0]?.value ?? 1
  const miniBarW   = cities.length > 0 ? 600 / cities.length : 1
  const activeOverlay = dragPreview ?? validBrush

  return (
    <div className={styles.section}>
      {/* Row 1: state selector + per-capita/volume toggle */}
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
            onClick={() => { setMode('perCapita'); setBrushRange(null); setDragPreview(null) }}
          >
            Per Capita
          </button>
          <button
            className={`${styles.tab} ${mode === 'volume' ? styles.tabActive : ''}`}
            onClick={() => { setMode('volume'); setBrushRange(null); setDragPreview(null) }}
          >
            Total Volume
          </button>
        </div>
      </div>

      {/* Row 2: scale mode toggle */}
      <div className={styles.scaleRow}>
        <span className={styles.scaleLabel}>Scale</span>
        <div className={styles.tabGroup}>
          {['normal', 'log', 'capped'].map(s => (
            <button
              key={s}
              className={`${styles.tab} ${scaleMode === s ? styles.tabActive : ''}`}
              onClick={() => setScaleMode(s)}
            >
              {s === 'normal' ? 'Normal' : s === 'log' ? 'Log' : 'Capped'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.hoverInfo}>{hoverLabel ?? ''}</div>

      {/* Main bar chart */}
      <div className={styles.chartArea}>
        {scaleMode !== 'normal' && (
          <div className={styles.scaleBadge}>
            {scaleMode === 'log' ? 'Log scale' : 'Capped at p98'}
          </div>
        )}
        {validBrush && (
          <div className={styles.brushBadge}>
            {validBrush.end - validBrush.start + 1} cities
          </div>
        )}
        <div className={styles.scrollContainer}>
          <div className={styles.chartInner}>
            <div className={styles.barTrack}>
              {visibleCities.length === 0 ? (
                <div className={styles.noData}>No data for {quarter} {year}</div>
              ) : visibleCities.map(city => {
                const isSelected = city.name === selectedName
                const isHovered  = hoveredCity?.name === city.name
                const heightPct  = getHeightPct(city.value, scaleMode, effectiveMax, capVal)
                const isCapped   = scaleMode === 'capped' && city.value > capVal

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
                        background: isSelected ? accentColor : getCityColor(`${city.name}|CA`),
                      }}
                    >
                      {isCapped && <div className={styles.overflowIndicator} />}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.axisLine} />
          </div>
        </div>
      </div>

      {/* Mini overview chart + brush */}
      <div className={styles.miniChartWrapper}>
        <div className={styles.miniChartHeader}>
          <span className={styles.miniChartLabel}>Overview — drag to zoom</span>
          {validBrush && (
            <button className={styles.brushClear} onClick={handleBrushClear}>
              × Clear zoom
            </button>
          )}
        </div>
        <svg
          ref={svgRef}
          className={styles.miniChart}
          viewBox="0 0 600 40"
          width="100%"
          height="40"
          onMouseDown={handleBrushMouseDown}
          onDoubleClick={handleBrushClear}
        >
          <rect x="0" y="0" width="600" height="40" fill="var(--surface-base)" />
          {cities.map((city, i) => {
            const bh = (city.value / miniMaxVal) * 38
            return (
              <rect
                key={city.name}
                x={i * miniBarW}
                y={40 - bh}
                width={Math.max(miniBarW - 0.5, 0.5)}
                height={bh}
                fill={getCityColor(`${city.name}|CA`)}
                opacity={0.55}
              />
            )
          })}
          {activeOverlay && (() => {
            const x1 = activeOverlay.start * miniBarW
            const x2 = (activeOverlay.end + 1) * miniBarW
            return (
              <>
                <rect x="0" y="0" width={x1} height="40" fill="white" opacity="0.6" />
                <rect x={x2} y="0" width={Math.max(600 - x2, 0)} height="40" fill="white" opacity="0.6" />
                <rect x={x1} y="0" width={x2 - x1} height="40" fill="none" stroke="var(--gray-500)" strokeWidth="1" />
              </>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
