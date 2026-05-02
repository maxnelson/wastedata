import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/pro-regular-svg-icons'
import nyanCat from '../../assets/nyan-cat.png'
import styles from './Footer.module.css'

function ExtIcon() {
  return <FontAwesomeIcon icon={faUpRightFromSquare} className={styles.extIcon} />
}

export default function Footer() {
  return (
    <footer className={styles.footer}>

      <div className={styles.inner}>

        <div className={styles.columns}>

          <div className={styles.col}>
            <h4 className={styles.colHeading}>Project</h4>
            <ul className={styles.colList}>
              <li><a href="/about" className={styles.colLink}>About the Data</a></li>
              <li>
                <a href="#donate" className={styles.colLink}>
                  Buy me a coffee :)
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
                  CalRecycle <ExtIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://dof.ca.gov/forecasting/demographics/estimates/"
                  className={styles.colLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  CA Dept. of Finance <ExtIcon />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <a
          href="https://maxnelsonwebsite.com/"
          className={styles.nyanLink}
          target="_blank"
          rel="noreferrer"
        >
          <img src={nyanCat} alt="Nyan Cat" className={styles.nyanCat} />
        </a>

      </div>

      <p className={styles.disclaimer}>Characterization figures are estimates, not direct measurements.</p>

      <div className={styles.copyright}>
        <p>© {new Date().getFullYear()} WasteData CA</p>
      </div>

    </footer>
  )
}
