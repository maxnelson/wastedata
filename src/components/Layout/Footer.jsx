import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        Data from{' '}
        <a href="https://www2.calrecycle.ca.gov/WasteCharacterization/" className={styles.link} target="_blank" rel="noreferrer">CalRecycle</a>
        {' and '}
        <a href="https://dof.ca.gov/forecasting/demographics/estimates/" className={styles.link} target="_blank" rel="noreferrer">CA Dept. of Finance</a>
        . Waste characterization figures are estimates — not direct measurements.
      </p>
      <p className={styles.copy}>© {new Date().getFullYear()} TrashData CA</p>
    </footer>
  )
}
