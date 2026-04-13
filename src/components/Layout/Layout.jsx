import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <div className={styles.content}>
          <main className={styles.main}>{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
