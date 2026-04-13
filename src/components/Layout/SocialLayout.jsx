import styles from './SocialLayout.module.css'
import { MOCK_DATA } from '../../data/cities'

// Matches the shared --cat-* tokens so donut segments stay consistent
const CATEGORIES = [
  { name: 'Organic',      pct: 42, color: '#52b788' },
  { name: 'Paper',        pct: 24, color: '#4895ef' },
  { name: 'Plastic',      pct: 12, color: '#f77f00' },
  { name: 'Construction', pct: 11, color: '#a07850' },
  { name: 'Metal',        pct:  3, color: '#8b9fa8' },
  { name: 'Residue',      pct:  3, color: '#6b7280' },
  { name: 'Special',      pct:  3, color: '#f4c430' },
  { name: 'Glass',        pct:  2, color: '#06b6d4' },
]

function buildConic(cats) {
  let deg = 0
  return `conic-gradient(${cats.map(c => {
    const s = deg
    deg += (c.pct / 100) * 360
    return `${c.color} ${s.toFixed(1)}deg ${deg.toFixed(1)}deg`
  }).join(', ')})`
}

function CityPanel({ city, side }) {
  const data = MOCK_DATA[city] || MOCK_DATA['Berkeley']
  const isGood = data.yoy < 0

  return (
    <div className={`${styles.panel} ${styles[`panel_${side}`]}`}>
      {/* City name */}
      <div className={styles.panelHeader}>
        <p className={styles.panelCounty}>{data.county} County</p>
        <h2 className={styles.panelCity}>{city}</h2>
        <p className={styles.panelPop}>Population {data.population}</p>
      </div>

      {/* Hero metric */}
      <div className={styles.heroMetric}>
        <span className={`${styles.heroNumber} num`}>{data.perCapita}</span>
        <div className={styles.heroLabels}>
          <span className={styles.heroUnit}>lbs</span>
          <span className={styles.heroDivider}>/</span>
          <span className={styles.heroUnit}>person</span>
          <span className={styles.heroDivider}>/</span>
          <span className={styles.heroUnit}>day</span>
        </div>
        <span
          className={`${styles.heroBadge} num`}
          style={{ color: isGood ? 'var(--status-positive)' : 'var(--status-negative)' }}
        >
          {isGood ? '↓' : '↑'} {Math.abs(data.yoy)}% vs last year
        </span>
      </div>

      {/* Donut */}
      <div className={styles.donutWrap}>
        <div className={styles.donutRing} style={{ background: buildConic(CATEGORIES) }} />
        <div className={styles.donutCenter}>
          <span className={`${styles.donutTotal} num`}>{(data.total / 1000).toFixed(0)}k</span>
          <span className={styles.donutUnit}>tons / quarter</span>
        </div>
      </div>

      {/* Top categories */}
      <div className={styles.breakdown}>
        {CATEGORIES.slice(0, 5).map(cat => (
          <div key={cat.name} className={styles.breakdownRow}>
            <span className={styles.breakdownName}>{cat.name}</span>
            <div className={styles.breakdownBar}>
              <div
                className={styles.breakdownFill}
                style={{ width: `${cat.pct}%`, background: cat.color }}
              />
            </div>
            <span className={`${styles.breakdownPct} num`}>{cat.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SocialLayout({ cityA, cityB }) {
  return (
    <div className={styles.comparison}>
      <CityPanel city={cityA} side="a" />
      <div className={styles.divider}>
        <span className={styles.vsBadge}>VS</span>
      </div>
      <CityPanel city={cityB} side="b" />
    </div>
  )
}
