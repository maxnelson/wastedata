import { useState } from 'react'
import { Info } from 'lucide-react'
import styles from './DonutChart.module.css'

const CX       = 200   // viewBox center x
const CY       = 200   // viewBox center y
const R        = 190   // outer radius
const HOLE     = 110   // inner radius
const GAP_DEG  = 1     // degrees of gap between each segment
const EXPLODE  = 12    // units to push selected segment outward

// One-word labels for the donut center — kept short to fit the hole at any scale
const SHORT_LABELS = {
  'Organic':               'Organic',
  'Paper & Cardboard':     'Paper',
  'Plastic':               'Plastic',
  'Construction & Inerts': 'Debris',
  'Metal':                 'Metal',
  'Mixed Residue':         'Mixed',
  'Special Waste':         'Special',
  'Glass':                 'Glass',
}

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, outerR, innerR, startDeg, endDeg) {
  const large = endDeg - startDeg > 180 ? 1 : 0
  const s  = polarToCartesian(cx, cy, outerR, startDeg)
  const e  = polarToCartesian(cx, cy, outerR, endDeg)
  const si = polarToCartesian(cx, cy, innerR, endDeg)
  const ei = polarToCartesian(cx, cy, innerR, startDeg)
  return [
    `M ${s.x} ${s.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ')
}

/**
 * DonutChart
 *
 * Props:
 *   categories — [{ name, pct, color }]
 */
export default function DonutChart({ categories }) {
  const defaultIdx = categories.reduce((best, cat, i) => cat.pct > categories[best].pct ? i : best, 0)
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx)
  const [infoOpen, setInfoOpen]       = useState(false)

  function selectSegment(i, isSelected) {
    if (isSelected) return          // clicking the active segment does nothing
    setSelectedIdx(i)
    setInfoOpen(false)              // collapse info whenever segment changes
  }

  // Pre-compute angular spans, accumulating from 0°
  let cursor = 0
  const segments = categories.map((cat, i) => {
    const span     = (cat.pct / 100) * 360
    const halfGap  = GAP_DEG / 2
    const startDeg = cursor + halfGap
    const endDeg   = cursor + span - halfGap
    cursor += span

    const midDeg = cursor - span / 2
    const midRad = (midDeg - 90) * (Math.PI / 180)
    const dx     = Math.cos(midRad) * EXPLODE
    const dy     = Math.sin(midRad) * EXPLODE

    const isSelected = selectedIdx === i
    const d = arcPath(CX, CY, R, HOLE, startDeg, endDeg)

    return (
      <path
        key={cat.name}
        d={d}
        fill={cat.color}
        stroke={isSelected ? '#ffe033' : 'none'}
        strokeWidth={isSelected ? 5 : 0}
        className={`${styles.segment} ${isSelected ? styles.segmentSelected : ''}`}
        transform={isSelected ? `translate(${dx}, ${dy})` : undefined}
        onClick={() => selectSegment(i, isSelected)}
      />
    )
  })

  const selected    = selectedIdx !== null ? categories[selectedIdx] : null
  const pctLabel    = selected
    ? (Number.isInteger(selected.pct) ? `${selected.pct}%` : `${selected.pct.toFixed(1)}%`)
    : null
  const shortLabel  = selected ? (SHORT_LABELS[selected.name] ?? selected.name) : null

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox="0 0 400 400"
        width="100%"
        overflow="visible"
        style={{ display: 'block' }}
        className={styles.donut}
      >
        {segments}

        {selected && (
          <>
            <text
              x={CX}
              y={182}
              className={styles.centerPct}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {pctLabel}
            </text>
            <text
              x={CX}
              y={234}
              className={styles.centerLabel}
              fill={selected.color}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {shortLabel}
            </text>
          </>
        )}
      </svg>

      {/* Explanation panel */}
      <div className={styles.explanation}>
        {selected ? (
          <>
            <div
              className={styles.explanationHeader}
              onClick={() => setInfoOpen(v => !v)}
              role="button"
              aria-expanded={infoOpen}
            >
              <span className={styles.explanationTitle}>{selected.name}</span>
              <span className={`${styles.infoBtn} ${infoOpen ? styles.infoBtnActive : ''}`}>
                <Info size={13} />
              </span>
            </div>
            {infoOpen && <p className={styles.explanationBody}>{LOREM}</p>}
          </>
        ) : (
          <p className={styles.explanationPrompt}>Select a segment to learn more.</p>
        )}
      </div>
    </div>
  )
}
