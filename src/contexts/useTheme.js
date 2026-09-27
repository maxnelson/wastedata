import { createContext, useContext } from 'react'

/** Theme state (see ThemeProvider in ThemeContext.jsx). */
export const ThemeContext = createContext(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
