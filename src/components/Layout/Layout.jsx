import { useState } from 'react'
import Sidebar from './Sidebar'
import styles from './Layout.module.css'

const STORAGE_KEY = 'wastedata.sidebarCollapsed'

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed)

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // Storage unavailable (private mode, blocked) — the choice just won't persist
    }
  }

  return (
    <div className={styles.body}>
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={`${styles.content} ${collapsed ? styles.contentCollapsed : ''}`}>
        {children}
      </div>
    </div>
  )
}
