import { createContext, useContext, useState } from 'react'

const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [year,    setYear]    = useState(2024)
  const [quarter, setQuarter] = useState('Q1')

  return (
    <FilterContext.Provider value={{ year, quarter, setYear, setQuarter }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  return useContext(FilterContext)
}
