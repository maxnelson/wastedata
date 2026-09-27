import { useState } from 'react'
import { FilterContext } from './useFilter'

export function FilterProvider({ children }) {
  const [year,    setYear]    = useState(2024)
  const [quarter, setQuarter] = useState('Q1')

  return (
    <FilterContext.Provider value={{ year, quarter, setYear, setQuarter }}>
      {children}
    </FilterContext.Provider>
  )
}
