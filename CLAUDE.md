# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TrashData — California Waste Management Dashboard

A React web app that visualizes CalRecycle waste disposal data for all ~419 California jurisdictions. Shows per-capita disposal rates, material composition breakdowns, and side-by-side city comparisons. Inspired by trashdata.net (design mockups in `docs/mockups/`).

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
npm run lint         # ESLint

# Data tools
npm run fetch:waste-characterization -- "Alameda"   # Download CalRecycle waste characterization xlsx
npm run fetch:waste-characterization -- --discover  # List all available counties
npm run gen:city-colors                             # Regenerate src/styles/cityPalette.js and src/data/cityColorMap.js
```

**Module type note:** `package.json` uses `"type": "module"`. The CalRecycle fetch script is `.cjs` to stay CommonJS.

## Architecture

### Routing
Only one active route: `/compare/:slugA/:slugB`. The root `/` immediately redirects to a random city pair. City identity lives entirely in the URL — no city state in React context.

URL segment format: `"san-francisco-ca"` (slug + state suffix). `src/utils/cityUrl.js` handles encode/decode.

### Data flow
```
data/processed/jurisdictions.json     ← master jurisdiction registry
data/processed/disposal/by_jurisdiction.json  ← quarterly tonnage per city
data/processed/population.json        ← annual population estimates
        ↓
src/data/cities.js                    ← imports all three, exports MOCK_DATA,
                                         disposalByJurisdiction, populationData,
                                         CITY_DATA (keyed "CityName|CA"), helpers
        ↓
Home.jsx / StateBarChart.jsx          ← compute derived values (per-capita, totals) on render
```

Per-capita formula: `(tons × 2000 lbs/ton) / 91.25 days / population` — produces lbs/person/day for a quarter.

### Global state
`FilterContext` (year + quarter) is the only shared state. Everything else is local component state or URL-derived.

### Styling
CSS Modules for all components. Design tokens (colors, spacing, typography, shadows, layout dimensions) live in `src/styles/tokens.css` and are referenced as CSS variables everywhere.

### City color system
`src/styles/cityPalette.js` — 400 color tokens (20 hues × 20 shades, named `cyan_01`…`sand_20`).
`src/data/cityColorMap.js` — static mapping of `"CityName|CA"` → palette token + `getCityColor()` helper.

**Both files are auto-generated** by `npm run gen:city-colors` (runs `tools/data_transformation/build_city_color_map.py`). Regenerate and commit whenever `jurisdictions.json` gains new entries. Do not edit them by hand.

### Charts
Charts are built with SVG and CSS — no D3 runtime dependency despite the tech-stack intention. `DonutChart.jsx` uses SVG arcs computed manually. `StateBarChart.jsx` uses CSS flex + inline `height` percentages.

## Active routes

- `/` → redirects to random city pair
- `/compare/:slugA/:slugB` — side-by-side city comparison (the only real page)

## Data Sources

### 1. CalRecycle Disposal Tonnage (Primary — Real Measured Data)
- **Files:** `data/raw/disposal-tonnage/calrecycle-disposal-YYYY.xlsx` (2019–2025)
- **Source:** https://www2.calrecycle.ca.gov/RecyclingDisposalReporting/Reports/OverallJurisdictionTonsForDisposal
- **What it is:** Quarterly reported waste tonnage at permitted disposal facilities (landfills, incinerators, EMSW) for every California jurisdiction.
- **Format:** .xlsx, ~1,676 rows (419 jurisdictions × 4 quarters) per year.
- **Key columns:** `Year`, `Quarter`, `Jurisdiction`, `County`, `Landfill`, `Transformation`, `Green Material ADC`, `Exported Green Material`
- **Critical:** Tracks disposal only — NOT recycled/composted material. CA's ~41% recycling rate means this is ~59% of total waste generated.

### 2. CalRecycle Waste Characterization (Estimated Material Breakdown)
- **Files:** `data/raw/waste-characterization/{county}/{commercial|residential|business-groups}/{city}_{type}.xlsx`
- **Source:** https://www2.calrecycle.ca.gov/WasteCharacterization/
- **What it is:** Estimated material composition (68 types across 10 categories) per jurisdiction.
- **Three data streams:**
  - `commercial/` — 68 material types, 4 waste streams (Disposed, Curbside Recycle, Curbside Organics, Other Diversion); `studyID=104`
  - `residential/` — Single-family vs multi-family breakdown, disposal only; `studyID=103`
  - `business-groups/` — Commercial breakdown by business sector
- **Important caveat:** These are ESTIMATES based on statewide studies applied to local employment/population data — not direct measurements.
- **Download script:** `tools/data_extraction/fetch-calrecycle-waste-characterization.js`
  - Commercial endpoint: `/_ExportToExcelMaterialTypeStreams` — confirmed working
  - Residential endpoint: `/_ExportToExcelResidentialStreams` — confirmed working (studyID=103 required)
- **Status:** Alameda County fully downloaded (16 jurisdictions, commercial + residential). 57 counties remaining.

### 3. California Department of Finance Population Data (To Be Acquired)
- **Source:** https://dof.ca.gov/forecasting/demographics/estimates/
- **What it is:** Annual population estimates for every CA city/county (E-4 Historical, 2020–2025).
- **Purpose:** Per-capita waste calculations (lbs/person/day).
- **Challenge:** Jurisdiction names won't match CalRecycle names — needs a mapping step.

## Material Categories for Donut Chart

| Category | % of Disposed Waste | Color |
|---|---|---|
| Organic (food, yard, textiles, carpet) | ~42% | Green |
| Paper & Cardboard | ~24% | Blue |
| Plastic | ~12% | Red/Orange |
| Construction & Inerts (wood, concrete, soil) | ~11% | Brown |
| Metal | ~3% | Gray |
| Mixed Residue | ~3% | Dark gray |
| Special Waste (bulky items, tires, medical) | ~3% | Yellow |
| Glass | ~2% | Teal |
| Electronics | ~1% | Purple |
| Household Hazardous | <1% | merge into Other |

## Key Terminology

- **Disposal** = waste that reached a landfill, incinerator, or EMSW facility
- **Diversion** = waste kept out of landfills via recycling/composting
- **Diversion Rate** = % of generated waste diverted (CA statewide: ~41%)
- **Transformation** = waste-to-energy incineration (both CA facilities closed 2024)
- **ADC** = Alternative Daily Cover (green waste used to cover landfill faces daily)
- **Jurisdiction** = a city, unincorporated county area, or regional waste authority
- **RDRS** = Recycling and Disposal Reporting System (CalRecycle's mandatory quarterly reporting)

## Current Status

- [x] Vite + React app scaffolded and running
- [x] City comparison view (`/compare/:slugA/:slugB`) built
- [x] DonutChart (material breakdown) built
- [x] StateBarChart (all-CA jurisdictions, per-capita + total volume modes) built
- [x] CalRecycle disposal tonnage files acquired (2019–2025)
- [x] Waste characterization downloader built (`fetch-calrecycle-waste-characterization.cjs`)
- [x] Alameda County waste characterization downloaded (16 jurisdictions, commercial + residential)
- [x] Per-city color palette system built (`npm run gen:city-colors`)
- [ ] Download remaining 57 counties (waste characterization)
- [ ] Acquire CA DOF population data
- [ ] Build data transformation pipeline for remaining counties
- [ ] Wire up single-city dashboard route (`/city/:slug`)
- [ ] Polish and deploy to Firebase Hosting
