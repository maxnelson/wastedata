import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>

      <p className={styles.source}>
        Data:{' '}
        <a
          href="https://www2.calrecycle.ca.gov/WasteCharacterization/"
          className={styles.link}
          target="_blank"
          rel="noreferrer"
        >
          CalRecycle
        </a>
        {' · '}
        <a
          href="https://dof.ca.gov/forecasting/demographics/estimates/"
          className={styles.link}
          target="_blank"
          rel="noreferrer"
        >
          CA Dept. of Finance
        </a>
        . Characterization figures are estimates, not direct measurements.
      </p>

      <nav className={styles.footerNav}>
        <a href="/about" className={styles.footerLink}>About the Data</a>
        <span className={styles.sep} />
        <a
          href="https://www2.calrecycle.ca.gov"
          className={styles.footerLink}
          target="_blank"
          rel="noreferrer"
        >
          CalRecycle
        </a>
        <span className={styles.sep} />
        <a
          href="https://github.com"
          className={styles.footerLink}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>

      <p className={styles.copy}>© {new Date().getFullYear()} TrashData CA</p>

    </footer>
  )
}
