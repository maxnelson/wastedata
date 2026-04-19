import jurisdictions from '../../data/processed/jurisdictions.json'
import disposalByJurisdiction from '../../data/processed/disposal/by_jurisdiction.json'
import populationData from '../../data/processed/population.json'

// All processed jurisdictions keyed by name — replaces MOCK_DATA
export { jurisdictions as MOCK_DATA }

export { disposalByJurisdiction }
export { populationData }

// Keyed by "CityName|STATE" — used by CityPicker to match geo-lookup results against available data.
export const CITY_DATA = Object.fromEntries(
  Object.entries(jurisdictions).map(([name, entry]) => [`${name}|CA`, entry])
)

// Fast O(1) lookup: does this app have data for a given "City|STATE" key?
export const CITY_KEYS = new Set(Object.keys(CITY_DATA))

// Map of year → Set of quarter numbers that have at least one disposal record.
// Used by the Sidebar to disable pill buttons for unavailable periods.
export const quartersWithData = (() => {
  const map = {}
  for (const records of Object.values(disposalByJurisdiction)) {
    for (const r of records) {
      if (!map[r.year]) map[r.year] = new Set()
      map[r.year].add(r.quarter)
    }
  }
  return map
})()

// Returns the disposal record for a city/year/quarter, or null if missing.
export function getDisposalRecord(cityName, year, quarter) {
  const records = disposalByJurisdiction[cityName]
  if (!records) return null
  return records.find(r => r.year === year && r.quarter === quarter) ?? null
}

// Compute per-capita lbs/person/day for a given disposal record + city + year.
// Falls back to 2020 population when the requested year isn't in the dataset (e.g. 2019).
// Returns null if data is missing.
export function computePerCapita(cityName, year, disposalRecord) {
  if (!disposalRecord) return null
  const popYears = populationData[cityName]?.pop
  if (!popYears) return null
  const pop = popYears[String(year)] ?? popYears['2020']
  if (!pop) return null
  // total is in tons; convert to lbs, divide by days in a quarter (~91.25)
  return +((disposalRecord.total * 2000) / 91.25 / pop).toFixed(2)
}
