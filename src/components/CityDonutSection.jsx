import { useState, useEffect } from "react";
import DonutChart from "./Charts/DonutChart";

const CATEGORY_COLORS = {
  Organic:                "#52b788",
  "Paper & Cardboard":    "#4895ef",
  Plastic:                "#f77f00",
  "Construction & Inerts":"#a07850",
  Metal:                  "#8b9fa8",
  "Mixed Residue":        "#6b7280",
  "Special Waste":        "#f4c430",
  Glass:                  "#06b6d4",
};

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

const FALLBACK_CATEGORIES = CATEGORY_ORDER.map(name => ({
  name,
  pct: { Organic:42, "Paper & Cardboard":24, Plastic:12, "Construction & Inerts":11, Metal:3, "Mixed Residue":3, "Special Waste":3, Glass:2 }[name],
  color: CATEGORY_COLORS[name],
}));

export default function CityDonutSection({ cityData }) {
  const [charData, setCharData] = useState(null);

  useEffect(() => {
    if (!cityData?.hasCharacterization) { setCharData(null); return; }
    const base = import.meta.env.VITE_DATA_BASE_URL;
    if (!base) { setCharData(null); return; }
    fetch(`${base}/${cityData.slug}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setCharData)
      .catch(() => setCharData(null));
  }, [cityData?.slug, cityData?.hasCharacterization]);

  const charSource = charData?.residential?.categories || charData?.commercial?.categories;
  const categories = charSource
    ? CATEGORY_ORDER.map(name => ({
        name,
        pct: charSource[name]?.pct ?? 0,
        color: CATEGORY_COLORS[name],
      }))
    : FALLBACK_CATEGORIES;

  return <DonutChart categories={categories} />;
}
