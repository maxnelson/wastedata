import { createContext, useContext } from 'react'

/** Year + quarter filter state (see FilterProvider in FilterContext.jsx). */
export const FilterContext = createContext(null)

export function useFilter() {
  return useContext(FilterContext)
}
