import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>

      <div className={styles.columns}>

        <div className={styles.col}>
          <h4 className={styles.colHeading}>Project</h4>
          <ul className={styles.colList}>
            <li><a href="/about" className={styles.colLink}>About the Data</a></li>
            <li>
              <a
                href="#portfolio"
                className={styles.colLink}
                target="_blank"
                rel="noreferrer"
              >
                Portfolio
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colHeading}>Data Sources</h4>
          <ul className={styles.colList}>
            <li>
              <a
                href="https://www2.calrecycle.ca.gov/WasteCharacterization/"
                className={styles.colLink}
                target="_blank"
                rel="noreferrer"
              >
                CalRecycle
              </a>
            </li>
            <li>
              <a
                href="https://dof.ca.gov/forecasting/demographics/estimates/"
                className={styles.colLink}
                target="_blank"
                rel="noreferrer"
              >
                CA Dept. of Finance
              </a>
            </li>
            <li className={styles.colNote}>Characterization figures are estimates, not direct measurements.</li>
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colHeading}>Support</h4>
          <ul className={styles.colList}>
            <li>
              <a href="#donate" className={styles.donateBtn}>
                Donate
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className={styles.copyright}>
        <p>© {new Date().getFullYear()} WasteData CA</p>
      </div>

    </footer>
  )
}
