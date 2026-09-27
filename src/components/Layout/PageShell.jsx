import AppHeader from './AppHeader'
import Footer from './Footer'
import styles from './PageShell.module.css'

/**
 * Fixed app header + footer around a page. Pages that need the year/quarter
 * sidebar wrap their content in <Layout>; static pages render directly.
 */
export default function PageShell({ children }) {
  return (
    <div className={styles.root}>
      <AppHeader />
      <div className={styles.body}>
        {children}
        <Footer />
      </div>
    </div>
  )
}
