import { useState, useMemo, useRef, useEffect } from 'react'
import { useAppData } from '../../contexts/DataContext'
import { useFilter } from '../../contexts/FilterContext'
import { getCityColor } from '../../data/cityColorMap'
import styles from './StateBarChart.module.css'

const STATE_NAMES = { CA: 'California' }
const AVAILABLE_STATES = ['CA']
const MIN_VISIBLE = 5

function getHeightPct(value, scaleMode, effectiveMax, capVal) {
  if (scaleMode === 'log')
    return (Math.log1p(value) / Math.log1p(effectiveMax)) * 100
  if (scaleMode === 'capped')
    return (Math.min(value, capVal) / capVal) * 100
  return (value / effectiveMax) * 100
}

function applyZoom(cities, currentBrush, deltaY, chartEl, clientX) {
  const totalCount = cities.length
  if (totalCount === 0) return null

  const currentStart = currentBrush?.start ?? 0
  const currentEnd   = currentBrush?.end   ?? totalCount - 1
  const currentCount = currentEnd - currentStart + 1

  const factor       = deltaY > 0 ? 1.15 : 1 / 1.15
  const newCount     = Math.round(currentCount * factor)
  const clampedCount = Math.max(MIN_VISIBLE, Math.min(totalCount, newCount))

  const rect      = chartEl.getBoundingClientRect()
  const pct       = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const anchorIdx = currentStart + Math.round(pct * (currentCount - 1))

  const before = Math.round(pct * (clampedCount - 1))
  let newStart = anchorIdx - before
  let newEnd   = newStart + clampedCount - 1

  if (newStart < 0)           { newEnd  -= newStart; newStart = 0 }
  if (newEnd >= totalCount)   { newStart -= (newEnd - totalCount + 1); newEnd = totalCount - 1 }
  newStart = Math.max(0, newStart)
  newEnd   = Math.min(totalCount - 1, newEnd)

  if (newEnd - newStart + 1 >= totalCount) return null
  return { start: newStart, end: newEnd }
}

export default function StateBarChart({ cityObj, accentColor = 'var(--accent-color)' }) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [mode, setMode]                   = useState('perCapita')
  const [hoveredCity, setHoveredCity]     = useState(null)
  const [scaleMode, setScaleMode]         = useState('normal')
  const [brushRange, setBrushRange]       = useState(null)
  const [pinnedCities, setPinnedCities]   = useState([])
  const [isPanning, setIsPanning]         = useState(false)

  const chartAreaRef = useRef(null)
  const zoomStateRef = useRef({ cities: [], validBrush: null })

  const { disposalByJurisdiction, populationData } = useAppData()
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
  }, [year, qNum, mode, effectiveState, disposalByJurisdiction, populationData])

  const capVal = useMemo(() => {
    if (cities.length === 0) return 1
    const sorted = [...cities].sort((a, b) => a.value - b.value)
    return sorted[Math.floor(0.98 * (sorted.length - 1))].value
  }, [cities])

  const validBrush = brushRange && brushRange.end < cities.length ? brushRange : null

  const visibleCities = useMemo(() => {
    if (!validBrush) return cities
    return cities.slice(validBrush.start, validBrush.end + 1)
  }, [cities, validBrush])

  const effectiveMax = visibleCities[0]?.value ?? 1

  // Keep ref current so wheel/touch handlers always read fresh state without re-attaching
  useEffect(() => { zoomStateRef.current = { cities, validBrush } }, [cities, validBrush])

  function valueStr(city) {
    return mode === 'perCapita'
      ? `${city.value} lbs/person/day`
      : `${Math.round(city.value).toLocaleString()} tons`
  }

  // ── Scroll-to-zoom (non-passive so preventDefault works) ──
  useEffect(() => {
    const el = chartAreaRef.current
    if (!el) return
    function handleWheel(e) {
      e.preventDefault()
      const { cities, validBrush } = zoomStateRef.current
      setBrushRange(applyZoom(cities, validBrush, e.deltaY, el, e.clientX))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // ── Pinch-to-zoom (mobile) ────────────────────────────────
  useEffect(() => {
    const el = chartAreaRef.current
    if (!el) return
    let lastDist = null

    function dist(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) { e.preventDefault(); lastDist = dist(e.touches) }
    }
    function onTouchMove(e) {
      if (e.touches.length !== 2 || lastDist === null) return
      e.preventDefault()
      const d       = dist(e.touches)
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const { cities, validBrush } = zoomStateRef.current
      // growing distance = fingers spreading = zoom in → negative pseudoDelta
      setBrushRange(applyZoom(cities, validBrush, d < lastDist ? 20 : -20, el, centerX))
      lastDist = d
    }
    function onTouchEnd() { lastDist = null }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])

  // ── Drag-to-pan ───────────────────────────────────────────
  function handlePanMouseDown(e) {
    if (!zoomStateRef.current.validBrush) return
    if (e.target.closest('button')) return
    e.preventDefault()

    const startX     = e.clientX
    const startBrush = { ...zoomStateRef.current.validBrush }
    const totalCount = zoomStateRef.current.cities.length
    setIsPanning(true)

    function onMove(ev) {
      const rect = chartAreaRef.current?.getBoundingClientRect()
      if (!rect) return
      const count       = startBrush.end - startBrush.start + 1
      const deltaCities = Math.round(((ev.clientX - startX) / rect.width) * count)
      let newStart = startBrush.start - deltaCities
      let newEnd   = startBrush.end   - deltaCities
      if (newStart < 0)         { newEnd -= newStart; newStart = 0 }
      if (newEnd >= totalCount) { newStart -= (newEnd - totalCount + 1); newEnd = totalCount - 1 }
      setBrushRange({ start: Math.max(0, newStart), end: Math.min(totalCount - 1, newEnd) })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      setIsPanning(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // Position strip: fraction of full dataset currently visible
  const stripLeft  = validBrush ? (validBrush.start / cities.length) * 100 : 0
  const stripWidth = validBrush
    ? ((validBrush.end - validBrush.start + 1) / cities.length) * 100
    : 100

  const chartCursorClass = isPanning
    ? styles.chartPanning
    : validBrush
      ? styles.chartZoomed
      : styles.chartDefault

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
            onClick={() => { setMode('perCapita'); setBrushRange(null) }}
          >
            Per Capita
          </button>
          <button
            className={`${styles.tab} ${mode === 'volume' ? styles.tabActive : ''}`}
            onClick={() => { setMode('volume'); setBrushRange(null) }}
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

      {/* Two fixed info rows: row1=pinned[0], row2=hovered??pinned[1] */}
      <div className={styles.infoSection}>
        {[hoveredCity ?? pinnedCities[1], pinnedCities[0]].map((city, i) => (
          <div key={i} className={styles.infoRow}>
            {city && <span><strong>{city.name}</strong>{' — '}{valueStr(city)}</span>}
          </div>
        ))}
      </div>

      {/* Main bar chart */}
      <div
        ref={chartAreaRef}
        className={`${styles.chartArea} ${chartCursorClass}`}
        onMouseDown={handlePanMouseDown}
      >
        {scaleMode !== 'normal' && (
          <div className={styles.scaleBadge}>
            {scaleMode === 'log' ? 'Log scale' : 'Capped at p98'}
          </div>
        )}
        {validBrush && (
          <div className={styles.brushBadge}>
            {validBrush.end - validBrush.start + 1} cities
            <button
              className={styles.brushClearInline}
              onClick={() => setBrushRange(null)}
            >
              ×
            </button>
          </div>
        )}
        <div className={styles.scrollContainer}>
          <div className={styles.chartInner}>
            <div className={styles.barTrack}>
              {visibleCities.length === 0 ? (
                <div className={styles.noData}>No data for {quarter} {year}</div>
              ) : visibleCities.map(city => {
                const isSelected = city.name === selectedName
                const isPinned   = pinnedCities.some(c => c.name === city.name)
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
                    onClick={() => {
                      setPinnedCities(prev => {
                        const alreadyIdx = prev.findIndex(c => c.name === city.name)
                        if (alreadyIdx !== -1) return prev.filter((_, i) => i !== alreadyIdx)
                        if (prev.length < 2) return [...prev, city]
                        return [prev[1], city]
                      })
                    }}
                  >
                    <div
                      className={`${styles.bar} ${isSelected ? styles.barSelected : ''} ${isPinned ? styles.barPinned : ''} ${isHovered && !isPinned ? styles.barHovered : ''}`}
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

      {/* Position strip + hint */}
      <div className={styles.zoomFooter}>
        <div className={styles.positionStrip}>
          <div
            className={styles.positionThumb}
            style={{ left: `${stripLeft}%`, width: `${stripWidth}%` }}
          />
        </div>
        <span className={styles.zoomHint}>
          {validBrush ? 'Drag to pan · Scroll to zoom' : 'Scroll to zoom'}
        </span>
      </div>
    </div>
  )
}
