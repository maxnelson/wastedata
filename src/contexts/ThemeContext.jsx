import { useEffect, useState } from 'react'
import { ThemeContext } from './useTheme'

const THEMES = [
  { id: 'analytical', label: 'Analytical', emoji: '📊' },
  { id: 'social',     label: 'Social',     emoji: '📱' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('td-theme') || 'analytical'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('td-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
