import { useState } from 'react'
import './App.css'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import { MOCK_DATA } from './data/cities'
import styles from './App.module.css'

export default function App() {
  const [cityA, setCityA] = useState('Berkeley')
  const [cityB, setCityB] = useState(null) // null = single-city mode

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
        <Layout>
          <div className={`${styles.panels} ${cityB ? styles.comparing : ''}`}>
            <div className={styles.panelA}>
              <Home city={cityA} vsPerCapita={perCapitaB} />
            </div>
            <div className={`${styles.panelB} ${cityB ? styles.panelBActive : ''}`}>
              {cityB && <Home city={cityB} vsPerCapita={perCapitaA} />}
            </div>
          </div>
        </Layout>
      </div>
      <Footer />
    </div>
  )
}
