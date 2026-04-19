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

// Returns the disposal record for a city/year/quarter, or null if missing.
export function getDisposalRecord(cityName, year, quarter) {
  const records = disposalByJurisdiction[cityName]
  if (!records) return null
  return records.find(r => r.year === year && r.quarter === quarter) ?? null
}

// Compute per-capita lbs/person/day for a given disposal record + city + year.
// Returns null if data is missing.
export function computePerCapita(cityName, year, disposalRecord) {
  if (!disposalRecord) return null
  const pop = populationData[cityName]?.pop?.[String(year)]
  if (!pop) return null
  // total is in tons; convert to lbs, divide by days in a quarter (~91.25)
  return +((disposalRecord.total * 2000) / 91.25 / pop).toFixed(2)
}
