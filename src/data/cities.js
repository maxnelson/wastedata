// Returns the disposal record for a city/year/quarter, or null if missing.
export function getDisposalRecord(disposalByJurisdiction, cityName, year, quarter) {
  const records = disposalByJurisdiction[cityName]
  if (!records) return null
  return records.find(r => r.year === year && r.quarter === quarter) ?? null
}

// Compute per-capita lbs/person/day for a given disposal record + city + year.
// Falls back to 2020 population when the requested year isn't in the dataset (e.g. 2019).
// Returns null if data is missing.
export function computePerCapita(populationData, cityName, year, disposalRecord) {
  if (!disposalRecord) return null
  const popYears = populationData[cityName]?.pop
  if (!popYears) return null
  const pop = popYears[String(year)] ?? popYears['2020']
  if (!pop) return null
  // total is in tons; convert to lbs, divide by days in a quarter (~91.25)
  return +((disposalRecord.total * 2000) / 91.25 / pop).toFixed(2)
}
