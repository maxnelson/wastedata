import jurisdictions from '../../data/processed/jurisdictions.json'

// All processed jurisdictions keyed by name — replaces MOCK_DATA
export { jurisdictions as MOCK_DATA }

// Keyed by "CityName|STATE" — used by CityPicker to match geo-lookup results against available data.
export const CITY_DATA = Object.fromEntries(
  Object.entries(jurisdictions).map(([name, entry]) => [`${name}|CA`, entry])
)

// Fast O(1) lookup: does this app have data for a given "City|STATE" key?
export const CITY_KEYS = new Set(Object.keys(CITY_DATA))
