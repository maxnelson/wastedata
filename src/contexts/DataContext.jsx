import { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext(null)
const BASE = import.meta.env.VITE_DATA_BASE_URL

export function DataProvider({ children }) {
  const [appData, setAppData] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/core/jurisdictions.json`).then(r => r.json()),
      fetch(`${BASE}/core/disposal/by_jurisdiction.json`).then(r => r.json()),
      fetch(`${BASE}/core/population.json`).then(r => r.json()),
    ]).then(([jurisdictions, disposalByJurisdiction, populationData]) => {
      const CITY_DATA = Object.fromEntries(
        Object.entries(jurisdictions).map(([name, entry]) => [`${name}|CA`, entry])
      )
      const CITY_KEYS = new Set(Object.keys(CITY_DATA))
      const quartersWithData = {}
      for (const records of Object.values(disposalByJurisdiction)) {
        for (const r of records) {
          if (!quartersWithData[r.year]) quartersWithData[r.year] = new Set()
          quartersWithData[r.year].add(r.quarter)
        }
      }
      setAppData({
        jurisdictions,
        disposalByJurisdiction,
        populationData,
        MOCK_DATA: jurisdictions,
        CITY_DATA,
        CITY_KEYS,
        quartersWithData,
      })
    })
  }, [])

  return <DataContext.Provider value={appData}>{children}</DataContext.Provider>
}

export function useAppData() {
  return useContext(DataContext)
}
