import { useState } from 'react'
import styles from './DonutChart.module.css'

const CX       = 200   // viewBox center x
const CY       = 200   // viewBox center y
const R        = 190   // outer radius
const HOLE     = 110   // inner radius
const GAP_DEG  = 1     // degrees of gap between each segment
const EXPLODE  = 12    // units to push selected segment outward

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
  const [selectedIdx, setSelectedIdx] = useState(null)

  // Pre-compute angular spans, accumulating from 0°
  let cursor = 0
  const segments = categories.map((cat, i) => {
    const span     = (cat.pct / 100) * 360
    const halfGap  = GAP_DEG / 2
    const startDeg = cursor + halfGap
    const endDeg   = cursor + span - halfGap
    cursor += span

    const midDeg   = cursor - span / 2
    const midRad   = (midDeg - 90) * (Math.PI / 180)
    const dx       = Math.cos(midRad) * EXPLODE
    const dy       = Math.sin(midRad) * EXPLODE

    const isSelected = selectedIdx === i
    const d = arcPath(CX, CY, R, HOLE, startDeg, endDeg)

    return (
      <path
        key={cat.name}
        d={d}
        fill={cat.color}
        stroke={isSelected ? '#ffe033' : 'none'}
        strokeWidth={isSelected ? 3 : 0}
        className={`${styles.segment} ${isSelected ? styles.segmentSelected : ''}`}
        transform={isSelected ? `translate(${dx}, ${dy})` : undefined}
        onClick={() => setSelectedIdx(isSelected ? null : i)}
      />
    )
  })

  const selected = selectedIdx !== null ? categories[selectedIdx] : null

  return (
    <svg
      viewBox="0 0 400 400"
      width="100%"
      style={{ display: 'block' }}
      className={styles.donut}
    >
      {segments}
      {selected && (
        <text
          x={CX}
          y={CY}
          className={styles.centerPct}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {Number.isInteger(selected.pct) ? `${selected.pct}%` : `${selected.pct.toFixed(1)}%`}
        </text>
      )}
    </svg>
  )
}
