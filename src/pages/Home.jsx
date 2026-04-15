import { useState } from "react";
import { Share2, Download } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import styles from "./Home.module.css";
import { MOCK_DATA } from "../data/cities";
import CityPicker from "../components/CityPicker";

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

// Build conic-gradient stops from pct values
function buildConicGradient(cats) {
  let deg = 0;
  const stops = cats.map((c) => {
    const start = deg;
    deg += (c.pct / 100) * 360;
    return `${c.color} ${start.toFixed(1)}deg ${deg.toFixed(1)}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

// Stable mock YoY changes per category (computed once at module level, not in render)
const YOY_CHANGES = [0.82, -1.43, 1.91, -0.67, 1.24];

// Simulated quarterly bar heights (24 quarters = 2019 Q1 → 2024 Q4)
const BAR_HEIGHTS = [
  68,
  74,
  71,
  65, // 2019
  58,
  42,
  52,
  60, // 2020 (COVID dip)
  66,
  72,
  78,
  75, // 2021
  80,
  83,
  79,
  77, // 2022
  74,
  71,
  76,
  73, // 2023
  70,
  68,
  72,
  69, // 2024
];

export default function Home({
  city = "Berkeley",
  cityObj = null,
  onCityChange,
  excludeCity,
  vsPerCapita = null,
}) {
  const data = MOCK_DATA[city] || MOCK_DATA["Berkeley"];
  const [activeTab, setActiveTab] = useState("disposed");
  const [activeTrend, setActiveTrend] = useState("quarterly");
  const [hoveredBar, setHoveredBar] = useState(null);

  // Build category list from real characterization data if available
  const charSource =
    activeTab === "disposed"
      ? data.commercial
      : data.residential || data.commercial;
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
  if (vsPerCapita !== null) {
    perf = data.perCapita <= vsPerCapita ? "better" : "worse";
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
          {data.county ? `${data.county} County` : ""}
          {cityObj?.state ? ` · ${cityObj.state}` : ""}
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
            {data.pop2024 ? `Population ${data.pop2024.toLocaleString()}` : ""}
          </p>
          {data.q1Total2024 && (
            <p className={styles.cityMeta}>
              {Math.round(data.q1Total2024).toLocaleString()} tons
            </p>
          )}
        </div>
      </div>

      {/* ── Per-capita hero ─────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroNum}>
          <span className={styles.heroLockup}>
            <FontAwesomeIcon icon={faTrashCan} className={styles.heroIcon} />
            <span className={`${styles.heroValue} num`}>{data.perCapita}</span>
          </span>
          <span className={styles.heroUnit}>lbs</span>
        </div>
        <p className={styles.heroLabel}>per person · per day</p>
        <div className={styles.heroAccentBar} />
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
              {["disposed", "all-streams"].map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === "disposed" ? "Disposed" : "All Streams"}
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
              <span className={`${styles.donutValue} num`}>
                {Math.round(data.q1Total2024).toLocaleString()}
              </span>
              <span className={styles.donutUnit}>tons disposed</span>
            </div>
          </div>

          <div className={styles.legend}>
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className={styles.legendRow}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: cat.color }}
                />
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
              {["quarterly", "annual"].map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTrend === t ? styles.tabActive : ""}`}
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
                  className={`${styles.bar} ${hoveredBar === i ? styles.barHovered : ""}`}
                  style={{ height: `${h}%` }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  title={`Q${(i % 4) + 1} ${2019 + Math.floor(i / 4)}`}
                />
              ))}
            </div>
            <div className={styles.barAxisLine} />
            <div className={styles.barAxis}>
              {["2019", "2020", "2021", "2022", "2023", "2024"].map((y) => (
                <span key={y} className={styles.axisLabel}>
                  {y}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.yoyList}>
            {CATEGORIES.slice(0, 5).map((cat, i) => {
              const change = YOY_CHANGES[i];
              const pos = change >= 0;
              return (
                <div key={cat.name} className={styles.yoyRow}>
                  <span
                    className={styles.yoySwatch}
                    style={{ background: cat.color }}
                  />
                  <span className={styles.yoyName}>{cat.name}</span>
                  <span
                    className={`${styles.yoyChange} num`}
                    style={{
                      color: pos
                        ? "var(--status-positive)"
                        : "var(--status-negative)",
                    }}
                  >
                    {pos ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page actions — intentionally at the bottom ──── */}
      <div className={styles.pageActions}>
        <button className={styles.actionBtn}>
          <Share2 size={13} />
          Share
        </button>
        <button className={styles.actionBtn}>
          <Download size={13} />
          Export CSV
        </button>
      </div>
    </div>
  );
}
