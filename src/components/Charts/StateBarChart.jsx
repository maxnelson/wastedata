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

  // ceil/floor guarantees at least 1 step even for small counts where round(N * 1.06) === N
  const newCount = deltaY > 0
    ? Math.ceil(currentCount * 1.06)
    : Math.floor(currentCount / 1.06)
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

export default function StateBarChart({
  cityObj,
  accentColor        = 'var(--accent-color)',
  compareCityObj     = null,
  compareAccentColor = 'var(--accent-color)',
  onCitySelect       = null,
}) {
  const [selectedState, setSelectedState] = useState(cityObj?.state ?? 'CA')
  const [mode, setMode]                   = useState('perCapita')
  const [hoveredCity, setHoveredCity]     = useState(null)
  const [scaleMode, setScaleMode]         = useState('normal')
  const [brushRange, setBrushRange]       = useState(null)
  const [isPanning, setIsPanning]         = useState(false)

  const chartAreaRef = useRef(null)
  const zoomStateRef = useRef({ cities: [], validBrush: null })
  const lastZoomRef  = useRef(0)
  const didDragRef   = useRef(false)

  const { disposalByJurisdiction, populationData } = useAppData()
  const { year, quarter } = useFilter()
  const qNum = parseInt(quarter.replace('Q', ''), 10)

  const effectiveState = cityObj?.state ?? selectedState
  const selectedName   = cityObj?.city ?? null
  const compareNameB   = compareCityObj?.city ?? null

  const cities = useMemo(() => {
    const entries = []
    for (const [name, records] of Object.entries(disposalByJurisdiction)) {
      if (effectiveState !== 'CA') continue
      const record = records.find(r => r.year === year && r.quarter === qNum)
      if (!record || record.total == null) continue
      const pop      = populationData[name]?.pop?.[String(year)] ?? null
      const perCapita = pop ? +((record.total * 2000) / 91.25 / pop).toFixed(2) : null
      if (mode === 'perCapita') {
        if (!pop) continue
        entries.push({ name, value: perCapita, total: record.total, pop, perCapita })
      } else {
        entries.push({ name, value: record.total, total: record.total, pop, perCapita })
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

  // Always look up from the full cities array so info rows work even when zoomed away
  const cityAEntry = selectedName  ? (cities.find(c => c.name === selectedName)  ?? null) : null
  const cityBEntry = compareNameB  ? (cities.find(c => c.name === compareNameB)  ?? null) : null

  // Keep ref current so wheel/touch handlers always read fresh state without re-attaching
  useEffect(() => { zoomStateRef.current = { cities, validBrush } }, [cities, validBrush])

  function cityInfoJsx(city) {
    const popPart   = city.pop      ? ` (${Math.round(city.pop).toLocaleString()} people)` : ''
    const totalPart = `${Math.round(city.total).toLocaleString()} tons total`
    const pcPart    = city.perCapita ? ` — ${city.perCapita} lbs/person/day` : ''
    return <><strong>{city.name}</strong>{popPart}: {totalPart}{pcPart}</>
  }

  // ── Scroll-to-zoom (non-passive so preventDefault works) ──
  useEffect(() => {
    const el = chartAreaRef.current
    if (!el) return
    function handleWheel(e) {
      e.preventDefault()
      if (e.deltaY === 0) return
      const now = Date.now()
      if (now - lastZoomRef.current < 80) return
      lastZoomRef.current = now
      const { cities, validBrush } = zoomStateRef.current
      setBrushRange(applyZoom(cities, validBrush, Math.sign(e.deltaY), el, e.clientX))
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
    didDragRef.current = false
    setIsPanning(true)

    function onMove(ev) {
      if (Math.abs(ev.clientX - startX) > 4) didDragRef.current = true
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

  const chartCursorClass = isPanning
    ? styles.chartPanning
    : validBrush
      ? styles.chartZoomed
      : styles.chartDefault

  const rangeStart = validBrush?.start ?? 0
  const rangeEnd   = validBrush?.end   ?? cities.length - 1

  const markerSources = [
    selectedName  ? { name: selectedName,  color: accentColor }        : null,
    compareNameB  ? { name: compareNameB,  color: compareAccentColor } : null,
    hoveredCity   ? { name: hoveredCity.name, color: getCityColor(`${hoveredCity.name}|CA`) } : null,
  ]
    .filter(Boolean)
    .filter((item, i, arr) => arr.findIndex(x => x.name === item.name) === i)

  const markerData = markerSources
    .map(({ name, color }) => {
      const cityIdx = cities.findIndex(c => c.name === name)
      if (cityIdx === -1) return null
      if (cityIdx < rangeStart) return { name, side: 'left', color }
      if (cityIdx > rangeEnd)   return { name, side: 'right', color }
      const idx = cityIdx - rangeStart
      const pct = (idx + 0.5) / visibleCities.length * 100
      return { name, side: 'center', pct, color }
    })
    .filter(Boolean)

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

      {/* Row 1 + 2: always-visible selected cities; Row 3: hovered city */}
      <div className={styles.infoSection}>
        <div className={styles.infoRow}>
          {cityAEntry && <span>{cityInfoJsx(cityAEntry)}</span>}
        </div>
        <div className={styles.infoRow}>
          {cityBEntry && <span>{cityInfoJsx(cityBEntry)}</span>}
        </div>
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
        <div className={styles.brushBadge}>
          {validBrush ? validBrush.end - validBrush.start + 1 : cities.length} cities
          {validBrush && (
            <button
              className={styles.brushClearInline}
              onClick={() => setBrushRange(null)}
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.scrollContainer}>
          <div className={styles.chartInner}>
            <div className={styles.barTrack}>
              {visibleCities.length === 0 ? (
                <div className={styles.noData}>No data for {quarter} {year}</div>
              ) : visibleCities.map(city => {
                const isSelected = city.name === selectedName
                const isCompare  = city.name === compareNameB
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
                      if (didDragRef.current) return
                      if (!onCitySelect) return
                      if (city.name === selectedName || city.name === compareNameB) return
                      onCitySelect({ city: city.name, state: 'CA', key: `${city.name}|CA` })
                    }}
                  >
                    <div
                      className={`${styles.bar} ${isSelected ? styles.barSelected : ''} ${isCompare ? styles.barCompare : ''} ${isHovered && !isSelected && !isCompare ? styles.barHovered : ''}`}
                      style={{
                        height: `${heightPct}%`,
                        background: isSelected
                          ? accentColor
                          : isCompare
                            ? compareAccentColor
                            : getCityColor(`${city.name}|CA`),
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
        <div className={styles.markerRow}>
          {markerData.some(m => m.side === 'left') && (
            <div className={styles.markerEdgeLeft}>
              {markerData.filter(m => m.side === 'left').map(({ name, color }) => (
                <div key={name} className={styles.markerPinEdge}>
                  <span className={styles.markerDot} style={{ background: color }} />
                  <span className={styles.markerLabel}>{name}</span>
                </div>
              ))}
            </div>
          )}
          {markerData
            .filter(m => m.side === 'center')
            .sort((a, b) => a.pct - b.pct)
            .map(({ name, pct, color }, i, arr) => {
              // single marker: flip if near left edge; two markers: rightmost flips right
              // so both labels always point away from each other and can never overlap
              const flipRight = arr.length > 1 ? i === arr.length - 1 : pct < 20
              return (
                <div
                  key={name}
                  className={`${styles.markerPin} ${flipRight ? styles.markerPinRight : ''}`}
                  style={{ left: `calc(${pct}% ${flipRight ? '- 4px' : '+ 4px'})` }}
                >
                  <span className={styles.markerLabel}>{name}</span>
                  <span className={styles.markerDot} style={{ background: color }} />
                </div>
              )
            })}
          {markerData.some(m => m.side === 'right') && (
            <div className={styles.markerEdgeRight}>
              {markerData.filter(m => m.side === 'right').map(({ name, color }) => (
                <div key={name} className={styles.markerPinEdge}>
                  <span className={styles.markerLabel}>{name}</span>
                  <span className={styles.markerDot} style={{ background: color }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className={styles.zoomHint}>
        {validBrush ? 'Drag to pan · Scroll to zoom' : 'Scroll to zoom'}
      </p>
    </div>
  )
}
