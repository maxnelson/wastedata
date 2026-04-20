import { useState, useEffect } from "react";
import { Info, ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import styles from "./Home.module.css";
import { MOCK_DATA, getDisposalRecord, computePerCapita, populationData } from "../data/cities";
import { useFilter } from "../contexts/FilterContext";
import CityPicker from "../components/CityPicker";
import DonutChart from "../components/Charts/DonutChart";
import StateBarChart from "../components/Charts/StateBarChart";

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
  MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

// Color palette for material categories — matches var(--cat-*) tokens
const CATEGORY_COLORS = {
  Organic: "#52b788",
  "Paper & Cardboard": "#4895ef",
  Plastic: "#f77f00",
  "Construction & Inerts": "#a07850",
  Metal: "#8b9fa8",
  "Mixed Residue": "#6b7280",
  "Special Waste": "#f4c430",
  Glass: "#06b6d4",
};

// Canonical order for display
const CATEGORY_ORDER = [
  "Organic",
  "Paper & Cardboard",
  "Plastic",
  "Construction & Inerts",
  "Metal",
  "Mixed Residue",
  "Special Waste",
  "Glass",
];

// Fallback statewide averages when no characterization data is available
const FALLBACK_CATEGORIES = [
  { name: "Organic", pct: 42 },
  { name: "Paper & Cardboard", pct: 24 },
  { name: "Plastic", pct: 12 },
  { name: "Construction & Inerts", pct: 11 },
  { name: "Metal", pct: 3 },
  { name: "Mixed Residue", pct: 3 },
  { name: "Special Waste", pct: 3 },
  { name: "Glass", pct: 2 },
];


export default function Home({
  city = "Berkeley",
  cityObj = null,
  onCityChange,
  excludeCity,
  vsPerCapita = null,
}) {
  const { year, quarter } = useFilter()
  const qNum = parseInt(quarter.replace('Q', ''), 10)

  const data = MOCK_DATA[city] || MOCK_DATA["Berkeley"];

  const [legendOpen, setLegendOpen]     = useState(false)
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const [charData, setCharData]         = useState(null)

  useEffect(() => {
    if (!data?.hasCharacterization) { setCharData(null); return }
    const base = import.meta.env.VITE_CHAR_BASE_URL
    if (!base) { setCharData(null); return }
    fetch(`${base}/${data.slug}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setCharData)
      .catch(() => setCharData(null))
  }, [data?.slug, data?.hasCharacterization])

  function toggleLegend() {
    setLegendOpen(v => {
      if (!v) setSourceExpanded(false)
      return !v
    })
  }
  const disposalRecord = getDisposalRecord(city, year, qNum)
  const livePerCapita = computePerCapita(city, year, disposalRecord)
  const liveTons = disposalRecord?.total ?? null
  const popYears = populationData[city]?.pop
  const livePop = popYears?.[String(year)] ?? popYears?.['2020'] ?? data.pop2024

  // Always show all-streams view (disposed + recycled + diverted)
  const charSource = charData?.residential?.categories || charData?.commercial?.categories;
  const CATEGORIES = charSource
    ? CATEGORY_ORDER.map((name) => ({
        name,
        pct: charSource[name]?.pct ?? 0,
        color: CATEGORY_COLORS[name],
      }))
    : FALLBACK_CATEGORIES.map((c) => ({
        ...c,
        color: CATEGORY_COLORS[c.name],
      }));

  // Performance color: compare against the other city if in comparison mode
  let perf = null;
  if (vsPerCapita !== null && livePerCapita !== null) {
    perf = livePerCapita <= vsPerCapita ? "better" : "worse";
  }

  const accentColor =
    perf === "better"
      ? "var(--perf-better)"
      : perf === "worse"
        ? "var(--perf-worse)"
        : "var(--brand-600)";

  return (
    <div className={styles.page} style={{ "--accent-color": accentColor }}>
      {/* ── City header ────────────────────────────────── */}
      <div className={styles.cityHeader}>
        <p className={styles.breadcrumb}>
          {cityObj?.state ? (STATE_NAMES[cityObj.state] ?? cityObj.state) : ""}
        </p>
        <div className={styles.cityNameRow}>
          <CityPicker
            value={cityObj}
            onChange={onCityChange}
            excludeCity={excludeCity}
          />
        </div>
        <div>
          <p className={styles.cityMeta}>
            {livePop ? `Population ${livePop.toLocaleString()}` : ""}
          </p>
          <p className={styles.cityMeta}>
            {liveTons != null ? `${Math.round(liveTons).toLocaleString()} tons` : '—'}
          </p>
        </div>
      </div>

      {/* ── Per-capita hero ─────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroNum}>
          <span className={styles.heroLockup}>
            <FontAwesomeIcon icon={faTrashCan} className={styles.heroIcon} />
            <span className={`${styles.heroValue} num`}>{livePerCapita ?? '—'}</span>
          </span>
          <span className={styles.heroUnit}>lbs</span>
        </div>
        <p className={styles.heroLabel}>
          <span className={styles.heroLabelPhrase}>per person</span>
          {' · '}
          <span className={styles.heroLabelPhrase}>per day</span>
        </p>
        <div className={styles.heroAccentBar} />
      </div>

      {/* ── Donut — full content width ──────────────────── */}
      <div>
        <div className={`${styles.cardHeader} ${legendOpen ? styles.cardHeaderOpen : ''}`}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Material Composition</h2>
            <button
              className={`${styles.infoBtn} ${legendOpen ? styles.infoBtnActive : ''}`}
              onClick={toggleLegend}
              aria-expanded={legendOpen}
              aria-label="About this data"
            >
              <Info size={13} />
            </button>
          </div>
        </div>

        {legendOpen && (
          <div className={styles.legendPanel}>
            <div className={styles.legend}>
              {CATEGORIES.map(cat => (
                <div key={cat.name} className={styles.legendRow}>
                  <span className={styles.legendSwatch} style={{ background: cat.color }} />
                  <span className={styles.legendName}>{cat.name}</span>
                </div>
              ))}
            </div>
            <div
              className={styles.legendSourceWrapper}
              onClick={() => setSourceExpanded(true)}
            >
              <div
                className={`${styles.legendSource} ${sourceExpanded ? '' : styles.legendSourceCollapsed}`}
              >
                These percentages are drawn from CalRecycle's Statewide Waste Characterization
                Study, which physically sorts and weighs waste samples from jurisdictions across
                California. Because the study is conducted periodically rather than annually, the
                material breakdown shown here reflects the most recent study results and remains
                constant across all years and quarters.{' '}
                <a
                  href="https://www2.calrecycle.ca.gov/WasteCharacterization/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  Learn more at CalRecycle ↗
                </a>
              </div>
              {!sourceExpanded && (
                <span className={styles.legendExpandChevron}>
                  <ChevronDown size={11} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <DonutChart categories={CATEGORIES} />

      {/* ── State-wide per-capita ranking ───────────────── */}
      <StateBarChart cityObj={cityObj} accentColor={accentColor} />

    </div>
  );
}
