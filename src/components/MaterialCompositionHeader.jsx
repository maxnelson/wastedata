import { useState } from "react";
import { Info } from "lucide-react";
import styles from "./MaterialCompositionHeader.module.css";

const CATEGORIES = [
  { name: "Organic",               color: "#52b788" },
  { name: "Paper & Cardboard",     color: "#4895ef" },
  { name: "Plastic",               color: "#f77f00" },
  { name: "Construction & Inerts", color: "#a07850" },
  { name: "Metal",                 color: "#8b9fa8" },
  { name: "Mixed Residue",         color: "#6b7280" },
  { name: "Special Waste",         color: "#f4c430" },
  { name: "Glass",                 color: "#06b6d4" },
];

export default function MaterialCompositionHeader() {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div>
      <div className={`${styles.cardHeader} ${legendOpen ? styles.cardHeaderOpen : ''}`}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>Material Composition</h2>
          <button
            className={`${styles.infoBtn} ${legendOpen ? styles.infoBtnActive : ''}`}
            onClick={() => setLegendOpen(v => !v)}
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
          <p className={styles.legendSource}>
            These percentages are drawn from CalRecycle's Statewide Waste Characterization
            Study, which physically sorts and weighs waste samples from jurisdictions across
            California. Because the study is conducted periodically rather than annually, the
            material breakdown shown here reflects the most recent study results and remains
            constant across all years and quarters.{' '}
            <a
              href="https://www2.calrecycle.ca.gov/WasteCharacterization/"
              target="_blank"
              rel="noreferrer"
            >
              Learn more at CalRecycle ↗
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
