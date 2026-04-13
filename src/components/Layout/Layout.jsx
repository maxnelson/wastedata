import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={styles.body}>
      <Sidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
