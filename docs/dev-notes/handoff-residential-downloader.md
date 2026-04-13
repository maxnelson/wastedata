# HANDOFF.md — Continuing the CalRecycle Downloader Debugging

This document picks up where `CLAUDE.md` left off. Read `CLAUDE.md` first for full project context.

## Current Status

We built a Node.js script (`fetch-waste-data-v2.js`) that downloads waste characterization data from CalRecycle's web tool. It needs two types of data per jurisdiction:

1. **Commercial Material Types** — ✅ WORKING. All 16 Alameda County jurisdictions downloaded successfully as .xlsx files. Files are in `data/waste-characterization/alameda/commercial/`.
2. **Residential Composition** — ❌ FAILING. Every jurisdiction returns HTTP 500. Files should go to `data/waste-characterization/alameda/residential/`.

## How the Script Works

The script (`fetch-waste-data-v2.js`) uses `axios` and `cheerio`. Dependencies: `npm install axios cheerio`.

### Endpoints Discovered (via HAR capture + HTML analysis)

| Purpose | Endpoint | Status |
|---------|----------|--------|
| County list | Parse `#CountyID` select from `/MaterialTypeStreams` page | ✅ Working |
| Jurisdictions | `/_LocalGovernmentsByCounty?countyID={id}` (AJAX, returns JSON) | ✅ Working |
| Commercial Excel export | `/_ExportToExcelMaterialTypeStreams` | ✅ Working |
| Residential Excel export | `/_ExportToExcelResidentialStreams` | ❌ 500 error |
| Commercial JSON grid | `/_MaterialTypeStreamsGridData?cy={id}&lg={id}` | Untested |
| Residential JSON grid | `/_ResidentialStreamsGridData?cy={id}&lg={id}` | Untested (attempted as fallback, also failing) |

### Working Commercial Export URL (for reference)

This is the exact URL pattern that works, discovered from a HAR capture:

```
/_ExportToExcelMaterialTypeStreams?sort=MaterialTypeCategoryNameGroup-asc&filter=~&group=~&columns={column_defs}&studyID=104&countyID=1&localGovernmentIDList=1001&localGovernmentIDListString=[1001]
```

The `columns` parameter is a pipe-delimited field|header mapping like: `MaterialTypeID| ,MaterialTypeCategoryNameGroup|Material Category,MaterialTypeName|Material Type,...`

### Why Residential Is Failing

The residential export endpoint (`_ExportToExcelResidentialStreams`) returns HTTP 500. The script's `downloadResidentialExcel` function tries four different parameter combinations, and all fail:

1. Simple: `countyID`, `localGovernmentIDList`, `localGovernmentIDListString`
2. With sort/filter/group added
3. With columns definition added  
4. With just `cy` and `lg` params

The 500 means the server received the request but choked — likely because the required parameters are different from what we're sending. We need to capture what the browser actually sends when exporting from the residential page.

## What Needs to Happen Next

### Step 1: Capture a HAR file from the Residential Export

The user needs to generate a HAR file showing the exact HTTP request the browser makes when clicking "Export to Excel" on the residential composition page. Here are the exact steps:

1. Open Chrome and navigate to: `https://www2.calrecycle.ca.gov/WasteCharacterization/ResidentialStreams`
2. Select **County: Alameda** from the dropdown
3. In the **Jurisdiction(s)** field, select **Alameda (Countywide)**
4. Click **Search** to load the data table
5. Open Chrome DevTools: press `F12` (or `Cmd+Option+I` on Mac)
6. Click the **Network** tab in DevTools
7. Make sure the record button (red circle) is active and "Preserve log" is checked
8. Now click the **"Export to Excel"** button/link on the page
9. You should see new requests appear in the Network tab
10. Look for the request that triggered the .xlsx download — it will likely have `Export` or `Excel` in the URL, and the Type will be something like `document` or `xlsx`
11. Right-click anywhere in the Network tab → **Save all as HAR with content**
12. Save the file (e.g., `residential_export.har`)

### Step 2: Analyze the HAR

Once we have the HAR, we need to extract:
- The exact URL path (likely `_ExportToExcelResidentialStreams` but could be different)
- All query parameters and their values
- Any required headers (like cookies or X-Requested-With)

Use this Python snippet to parse the HAR:

```python
import json
from urllib.parse import urlparse, parse_qs

with open('residential_export.har') as f:
    har = json.load(f)

for entry in har['log']['entries']:
    url = entry['request']['url']
    if 'export' in url.lower() or 'excel' in url.lower() or 'residential' in url.lower():
        print(f"URL: {url}")
        print(f"Method: {entry['request']['method']}")
        print(f"Status: {entry['response']['status']}")
        parsed = urlparse(url)
        print(f"Path: {parsed.path}")
        print("Params:")
        for k, v in parse_qs(parsed.query).items():
            print(f"  {k} = {v[0]}")
        print(f"Content-Type: {entry['response']['content'].get('mimeType', '')}")
```

### Step 3: Update the Script

Once we know the correct parameters, update the `downloadResidentialExcel` function in `fetch-waste-data-v2.js`. The function is around line 280. It currently tries 4 parameter sets — we'd replace them with the correct one from the HAR.

### Step 4: Test

```bash
node fetch-waste-data-v2.js "Alameda" --residential
```

If successful, all 16 jurisdictions should download to `data/waste-characterization/alameda/residential/`.

## Alternative Approach: JSON Grid Endpoint

If the Excel export continues to fail, there's a JSON alternative. The CalRecycle pages use Kendo UI grids that load data via AJAX. The commercial page uses `/_MaterialTypeStreamsGridData`. There should be a residential equivalent. 

To find it: open the residential page in the browser, open DevTools Network tab, click Search, and look for XHR/Fetch requests that return JSON with the grid data. That URL can be used with the `--format json` flag.

## Script CLI Reference

```bash
node fetch-waste-data-v2.js --discover              # List all counties
node fetch-waste-data-v2.js "Alameda"               # Download both commercial + residential
node fetch-waste-data-v2.js "Alameda" --residential  # Residential only (skip commercial)
node fetch-waste-data-v2.js "Alameda" --commercial   # Commercial only (skip residential)
node fetch-waste-data-v2.js "Alameda" --format json  # Use JSON grid endpoints instead of Excel
node fetch-waste-data-v2.js "Alameda" --delay 10000  # 10s between requests
```

## File Locations

- Script: `fetch-waste-data-v2.js` (in the project root or data_fetcher directory)
- Downloaded commercial data: `data/waste-characterization/alameda/commercial/*.xlsx`
- Downloaded residential data (target): `data/waste-characterization/alameda/residential/*.xlsx`
- Counties list: `data/waste-characterization/counties.json`

## Key Context

- The CalRecycle site uses **Kendo UI** for grids, multiselects, and exports
- The commercial export worked because we had a HAR capture from that exact page
- The residential page is at a different URL (`/ResidentialStreams` vs `/MaterialTypeStreams`) and likely has a different grid configuration and export handler
- The user wants to be respectful of the server — use 7-10 second delays between requests
- The user has the CalRecycle site open in their browser and can capture HAR files
- All 58 California counties need to be downloaded eventually, but we're debugging with Alameda first
