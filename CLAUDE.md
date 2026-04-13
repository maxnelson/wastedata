# CLAUDE.md — TrashData California Waste Management Dashboard

## Project Overview

A web application that visualizes waste management data for California cities and counties. Shows waste disposal volumes, material composition breakdowns, per-capita waste generation, and city-to-city comparisons. Inspired by the original trashdata.net project (see mockups in `docs/mockups/`).

## Tech Stack

- **Build:** Vite
- **UI:** React 18+
- **Charts:** D3.js (chosen for pixel-perfect control over custom donut charts, tooltips, and interactions)
- **Styling:** TBD (CSS Modules or Tailwind)
- **Routing:** React Router v6
- **Hosting:** Firebase Hosting (planned)
- **Data Storage:** Static JSON for MVP, possible Firebase/Firestore later

## Project Structure

```
wastedata/                              ← project root (web app root)
├── src/                                ← Vite + React source (to be scaffolded)
│   ├── components/
│   │   ├── Charts/
│   │   ├── Controls/
│   │   ├── Layout/
│   │   └── Comparison/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   └── main.jsx
├── public/
├── data/
│   ├── raw/                            ← source files, never modified after download
│   │   ├── disposal-tonnage/           ← CalRecycle quarterly disposal xlsx (2019–2025)
│   │   └── waste-characterization/     ← CalRecycle waste composition xlsx
│   │       ├── counties.json
│   │       └── {county}/
│   │           ├── commercial/         ← {city}_commercial.xlsx
│   │           ├── residential/        ← {city}_residential.xlsx
│   │           └── business-groups/    ← {city}_business-groups.xlsx
│   └── processed/                      ← JSON output from transformation pipeline
│       ├── jurisdictions.json
│       ├── disposal/
│       └── characterization/
├── tools/
│   ├── data_extraction/                ← CalRecycle downloaders (Node.js)
│   │   ├── fetch-calrecycle-waste-characterization.js
│   │   └── README.md
│   ├── data_transformation/            ← xlsx → JSON (Python, to be built)
│   └── data_validation/                ← cross-checks (Python, to be built)
├── docs/
│   ├── mockups/                        ← trashdata.net design reference screenshots
│   └── dev-notes/                      ← HAR captures, handoff notes
├── package.json                        ← single package.json; tool deps under devDependencies
├── node_modules/
├── index.html                          ← Vite entry (to be created)
└── vite.config.js                      ← (to be created)
```

## Running the Data Extraction Tools

```bash
# From project root — uses the npm script alias
npm run fetch:waste-characterization -- "Alameda"
npm run fetch:waste-characterization -- "Alameda" --residential
npm run fetch:waste-characterization -- --discover

# Or run directly
node tools/data_extraction/fetch-calrecycle-waste-characterization.js "Alameda"
node tools/data_extraction/fetch-calrecycle-waste-characterization.js --discover
```

**Note on module types:** When Vite is scaffolded (which adds `"type": "module"` to package.json), rename the fetch script from `.js` to `.cjs` so Node continues to treat it as CommonJS.

## Routing (planned)

- `/` — Home / city selector
- `/city/:slug` — Single city dashboard
- `/compare/:city1/:city2` — City comparison

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

- [x] Data sources understood and documented
- [x] CalRecycle disposal tonnage files acquired (2019–2025)
- [x] Waste characterization downloader built and debugged (`fetch-calrecycle-waste-characterization.js`)
- [x] Alameda County downloaded — all 16 jurisdictions, commercial + residential
- [x] Project restructured as web app root with proper data/tools/src layout
- [ ] Download remaining 57 counties (waste characterization)
- [ ] Acquire CA DOF population data
- [ ] Build data transformation pipeline (xlsx → JSON into `data/processed/`)
- [ ] Scaffold Vite + React (run `npm create vite@latest . -- --template react`)
- [ ] Build core components (DonutChart first)
- [ ] Wire up single city dashboard
- [ ] Build comparison view
- [ ] Polish and deploy
