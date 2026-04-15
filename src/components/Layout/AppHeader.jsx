import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/pro-regular-svg-icons'
import styles from './AppHeader.module.css'

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <FontAwesomeIcon icon={faTrashCan} className={styles.logoMark} />
        <span className={styles.logoName}>WasteData</span>
      </div>
    </header>
  )
}
