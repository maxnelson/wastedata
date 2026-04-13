import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import styles from './ThemeDevSwitcher.module.css'

/**
 * Floating dev-only UI for switching between design system themes.
 * Persists choice to localStorage. Remove from production build if desired.
 */
export default function ThemeDevSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel}>
          <p className={styles.panelLabel}>Design System</p>
          {themes.map(t => (
            <button
              key={t.id}
              className={`${styles.themeBtn} ${theme === t.id ? styles.themeBtnActive : ''}`}
              onClick={() => { setTheme(t.id); setOpen(false) }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {theme === t.id && <span className={styles.check}>✓</span>}
            </button>
          ))}
          <p className={styles.hint}>dev tool — not shown in production</p>
        </div>
      )}
      <button
        className={styles.trigger}
        onClick={() => setOpen(v => !v)}
        title="Switch design theme"
      >
        🎨
      </button>
    </div>
  )
}
