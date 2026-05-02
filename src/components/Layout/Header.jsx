import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <svg className={styles.logoMark} viewBox="0 0 28 28" fill="none">
          <circle
            cx="14"
            cy="14"
            r="13"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <path
            d="M14 6c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M14 6l-2.5 3M14 6l2.5 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.logoName}>Wastedata</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <a href="/" className={`${styles.navLink} ${styles.navLinkActive}`}>
          Dashboard
        </a>
        <a href="/compare" className={styles.navLink}>
          Compare Cities
        </a>
        <a href="/about" className={styles.navLink}>
          About the Data
        </a>
      </nav>

      {/* Right actions */}
      <div className={styles.actions}>
        <a
          href="https://github.com"
          className={styles.ghBtn}
          target="_blank"
          rel="noreferrer"
        >
          <svg
            className={styles.ghIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
