/**
 * DisposalTrendChart — saved for future use, not currently rendered.
 *
 * Shows quarterly disposal tonnage trend bars (2019–2024) with a
 * quarterly/annual toggle and per-category YoY change list.
 *
 * Props:
 *   categories  — [{ name, pct, color }]  (from Home CATEGORY_ORDER build)
 *   accentColor — CSS color string for bar fill
 */
import { useState } from 'react'
import styles from './DisposalTrendChart.module.css'

const YOY_CHANGES = [0.82, -1.43, 1.91, -0.67, 1.24]

const BAR_HEIGHTS = [
  68, 74, 71, 65, // 2019
  58, 42, 52, 60, // 2020 (COVID dip)
  66, 72, 78, 75, // 2021
  80, 83, 79, 77, // 2022
  74, 71, 76, 73, // 2023
  70, 68, 72, 69, // 2024
]

export default function DisposalTrendChart({ categories = [], accentColor = 'var(--brand-600)' }) {
  const [activeTrend, setActiveTrend] = useState('quarterly')
  const [hoveredBar, setHoveredBar]   = useState(null)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Disposal Trend</h2>
          <p className={styles.cardSub}>Quarterly totals · 2019–2024</p>
        </div>
        <div className={styles.tabGroup}>
          {['quarterly', 'annual'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTrend === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTrend(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.barChart}>
        <div className={styles.barGroup} style={{ '--bar-color': accentColor }}>
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={`${styles.bar} ${hoveredBar === i ? styles.barHovered : ''}`}
              style={{ height: `${h}%` }}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              title={`Q${(i % 4) + 1} ${2019 + Math.floor(i / 4)}`}
            />
          ))}
        </div>
        <div className={styles.barAxisLine} />
        <div className={styles.barAxis}>
          {['2019', '2020', '2021', '2022', '2023', '2024'].map(y => (
            <span key={y} className={styles.axisLabel}>{y}</span>
          ))}
        </div>
      </div>

      <div className={styles.yoyList}>
        {categories.slice(0, 5).map((cat, i) => {
          const change = YOY_CHANGES[i]
          const pos = change >= 0
          return (
            <div key={cat.name} className={styles.yoyRow}>
              <span className={styles.yoySwatch} style={{ background: cat.color }} />
              <span className={styles.yoyName}>{cat.name}</span>
              <span
                className={`${styles.yoyChange} num`}
                style={{ color: pos ? 'var(--status-positive)' : 'var(--status-negative)' }}
              >
                {pos ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
