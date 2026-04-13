import { useState, useEffect } from 'react'
import './App.css'
import { useTheme } from './contexts/ThemeContext'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import SocialLayout from './components/Layout/SocialLayout'
import Home from './pages/Home'
import { CITIES, MOCK_DATA } from './data/cities'
import styles from './App.module.css'

export default function App() {
  const { theme } = useTheme()
  const [cityA, setCityA] = useState('Berkeley')
  const [cityB, setCityB] = useState(null) // null = single-city mode

  // When switching to the social theme, ensure cityB is always set
  // (the comparison panels need two cities to render)
  useEffect(() => {
    if (theme === 'social' && cityB === null) {
      setCityB(CITIES.find(c => c !== cityA) || 'Oakland')
    }
  }, [theme])

  const perCapitaA = MOCK_DATA[cityA]?.perCapita ?? null
  const perCapitaB = cityB ? (MOCK_DATA[cityB]?.perCapita ?? null) : null

  return (
    <div className={styles.root}>
      <AppHeader
        cityA={cityA}
        cityB={cityB}
        onCityAChange={setCityA}
        onCityBChange={setCityB}
      />
      <div className={styles.body}>
        {theme === 'social' ? (
          <SocialLayout cityA={cityA} cityB={cityB || 'Oakland'} />
        ) : (
          <Layout>
            {/* Comparison panel wrapper — animates between single and two-column */}
            <div className={`${styles.panels} ${cityB ? styles.comparing : ''}`}>
              <div className={styles.panelA}>
                <Home city={cityA} vsPerCapita={perCapitaB} />
              </div>
              <div className={`${styles.panelB} ${cityB ? styles.panelBActive : ''}`}>
                {cityB && <Home city={cityB} vsPerCapita={perCapitaA} />}
              </div>
            </div>
          </Layout>
        )}
      </div>
      <Footer />
    </div>
  )
}
