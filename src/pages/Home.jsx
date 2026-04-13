import { useState } from 'react'
import styles from './Home.module.css'
import { MOCK_DATA } from '../data/cities'

// Matches var(--cat-*) tokens in order, rendered as conic-gradient stops
const CATEGORIES = [
  { name: 'Organic',              pct: 42, color: '#52b788' },
  { name: 'Paper & Cardboard',    pct: 24, color: '#4895ef' },
  { name: 'Plastic',              pct: 12, color: '#f77f00' },
  { name: 'Construction & Inerts',pct: 11, color: '#a07850' },
  { name: 'Metal',                pct:  3, color: '#8b9fa8' },
  { name: 'Mixed Residue',        pct:  3, color: '#6b7280' },
  { name: 'Special Waste',        pct:  3, color: '#f4c430' },
  { name: 'Glass',                pct:  2, color: '#06b6d4' },
]

// Build conic-gradient stops from pct values
function buildConicGradient(cats) {
  let deg = 0
  const stops = cats.map(c => {
    const start = deg
    deg += (c.pct / 100) * 360
    return `${c.color} ${start.toFixed(1)}deg ${deg.toFixed(1)}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

// Simulated quarterly bar heights (24 quarters = 2019 Q1 → 2024 Q4)
const BAR_HEIGHTS = [
  68, 74, 71, 65,   // 2019
  58, 42, 52, 60,   // 2020 (COVID dip)
  66, 72, 78, 75,   // 2021
  80, 83, 79, 77,   // 2022
  74, 71, 76, 73,   // 2023
  70, 68, 72, 69,   // 2024
]

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.5 2.5 0 0 1 13 4.5z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  )
}

export default function Home({ city = 'Berkeley' }) {
  const data = MOCK_DATA[city] || MOCK_DATA['Berkeley']
  const [activeTab,    setActiveTab]    = useState('disposed')
  const [activeTrend,  setActiveTrend]  = useState('quarterly')
  const [hoveredBar,   setHoveredBar]   = useState(null)

  return (
    <div className={styles.page}>

      {/* ── City header ────────────────────────────────── */}
      <div className={styles.cityHeader}>
        <div>
          <p className={styles.breadcrumb}>{data.county} County</p>
          <h1 className={styles.cityName}>{city}</h1>
          <p className={styles.cityMeta}>Population {data.population}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn}><ShareIcon /> Share</button>
          <button className={styles.actionBtn}><DownloadIcon /> Export CSV</button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Disposed</p>
          <div className={styles.statValueRow}>
            <span className={`${styles.statValue} num`} style={{ color: 'var(--brand-700)' }}>{data.total.toLocaleString()}</span>
            <span className={styles.statUnit}>tons</span>
          </div>
          <p className={styles.statSub}>Q1 2024</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Per Capita</p>
          <div className={styles.statValueRow}>
            <span className={`${styles.statValue} num`} style={{ color: 'var(--cat-glass)' }}>{data.perCapita}</span>
            <span className={styles.statUnit}>lbs/day</span>
          </div>
          <p className={styles.statSub}>per resident</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Landfill Share</p>
          <div className={styles.statValueRow}>
            <span className={`${styles.statValue} num`} style={{ color: 'var(--cat-plastic)' }}>94%</span>
          </div>
          <p className={styles.statSub}>of total stream</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>YoY Change</p>
          <div className={styles.statValueRow}>
            <span className={`${styles.statValue} num`} style={{ color: data.yoy < 0 ? 'var(--status-positive)' : 'var(--status-negative)' }}>
              {data.yoy > 0 ? '+' : ''}{data.yoy}%
            </span>
          </div>
          <p className={styles.statSub}>vs Q1 2023</p>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────── */}
      <div className={styles.chartsGrid}>

        {/* Composition donut */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Material Composition</h2>
              <p className={styles.cardSub}>By disposed weight · Q1 2024</p>
            </div>
            <div className={styles.tabGroup}>
              {['disposed', 'all-streams'].map(t => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === 'disposed' ? 'Disposed' : 'All Streams'}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.donutWrap}>
            <div
              className={styles.donutRing}
              style={{ background: buildConicGradient(CATEGORIES) }}
            />
            <div className={styles.donutCenter}>
              <span className={`${styles.donutValue} num`}>{data.total.toLocaleString()}</span>
              <span className={styles.donutUnit}>tons disposed</span>
            </div>
          </div>

          <div className={styles.legend}>
            {CATEGORIES.map(cat => (
              <div key={cat.name} className={styles.legendRow}>
                <span className={styles.legendSwatch} style={{ background: cat.color }} />
                <span className={styles.legendName}>{cat.name}</span>
                <span className={`${styles.legendPct} num`}>{cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend bars */}
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
            <div className={styles.barGroup}>
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

          {/* Year-over-year change list */}
          <div className={styles.yoyList}>
            {CATEGORIES.slice(0, 5).map(cat => {
              const change = (Math.random() * 4 - 2).toFixed(2)
              const pos = parseFloat(change) >= 0
              return (
                <div key={cat.name} className={styles.yoyRow}>
                  <span className={styles.yoySwatch} style={{ background: cat.color }} />
                  <span className={styles.yoyName}>{cat.name}</span>
                  <span className={`${styles.yoyChange} num`} style={{ color: pos ? 'var(--status-positive)' : 'var(--status-negative)' }}>
                    {pos ? '+' : ''}{change}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
