import { createContext, useContext } from 'react'

/** Loaded dataset (see DataProvider in DataContext.jsx); null until the core files arrive. */
export const DataContext = createContext(null)

export function useAppData() {
  return useContext(DataContext)
}
