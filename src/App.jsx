import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import MaterialCompositionHeader from './components/MaterialCompositionHeader'
import CityDonutSection from './components/CityDonutSection'
import StateBarChart from './components/Charts/StateBarChart'
import { segmentToCityObj, cityObjToSegment, randomCityPair } from './utils/cityUrl'
import { FilterProvider } from './contexts/FilterContext'
import { useAppData } from './contexts/DataContext'
import styles from './App.module.css'

/** Picks two random cities and redirects immediately. */
function RandomRedirect() {
  const { jurisdictions } = useAppData()
  const [a, b] = randomCityPair(jurisdictions)
  return <Navigate to={`/compare/${cityObjToSegment(jurisdictions, a)}/${cityObjToSegment(jurisdictions, b)}`} replace />
}

/** Main comparison view — city state lives entirely in the URL. */
function CompareView() {
  const { slugA, slugB } = useParams()
  const navigate = useNavigate()
  const { jurisdictions, MOCK_DATA } = useAppData()

  const cityA = segmentToCityObj(jurisdictions, slugA)
  const cityB = segmentToCityObj(jurisdictions, slugB)

  // Unknown slugs → start over with random cities
  if (!cityA || !cityB) return <Navigate to="/" replace />

  function handleCityAChange(newCity) {
    navigate(`/compare/${cityObjToSegment(jurisdictions, newCity)}/${slugB}`, { replace: true })
  }
  function handleCityBChange(newCity) {
    navigate(`/compare/${slugA}/${cityObjToSegment(jurisdictions, newCity)}`, { replace: true })
  }

  const perCapitaA = MOCK_DATA[cityA.city]?.perCapita ?? null
  const perCapitaB = MOCK_DATA[cityB.city]?.perCapita ?? null

  const cityAData = MOCK_DATA[cityA.city] ?? null
  const cityBData = MOCK_DATA[cityB.city] ?? null

  const perfA = (perCapitaA !== null && perCapitaB !== null)
    ? (perCapitaA <= perCapitaB ? 'better' : 'worse')
    : null
  const accentColorA = perfA === 'better'
    ? 'var(--perf-better)'
    : perfA === 'worse'
      ? 'var(--perf-worse)'
      : 'var(--brand-600)'

  return (
    <div className={styles.root}>
      <AppHeader />
      <div className={styles.body}>
        <FilterProvider>
        <Layout>
          {/* Row 1: city header + hero (per city) */}
          <div className={`${styles.panels} ${styles.comparing}`}>
            <div className={styles.panelA}>
              <Home
                city={cityA.city}
                cityObj={cityA}
                onCityChange={handleCityAChange}
                excludeCity={cityB}
                vsPerCapita={perCapitaB}
                compareMode
              />
            </div>
            <div className={`${styles.panelB} ${styles.panelBActive}`}>
              <Home
                city={cityB.city}
                cityObj={cityB}
                onCityChange={handleCityBChange}
                excludeCity={cityA}
                vsPerCapita={perCapitaA}
                compareMode
              />
            </div>
          </div>

          {/* Row 2: shared material composition header */}
          <div className={styles.fullWidthSection}>
            <MaterialCompositionHeader />
          </div>

          {/* Row 3: per-city donut charts */}
          <div className={`${styles.panels} ${styles.comparing}`}>
            <div className={styles.panelA}>
              <div className={styles.donutPanel}>
                <CityDonutSection cityData={cityAData} />
              </div>
            </div>
            <div className={`${styles.panelB} ${styles.panelBActive}`}>
              <div className={styles.donutPanel}>
                <CityDonutSection cityData={cityBData} />
              </div>
            </div>
          </div>

          {/* Row 4: unified state bar chart (City A highlighted) */}
          <div className={styles.fullWidthSection}>
            <StateBarChart cityObj={cityA} accentColor={accentColorA} />
          </div>
        </Layout>
        </FilterProvider>
      <Footer />
      </div>
    </div>
  )
}

export default function App() {
  const appData = useAppData()
  if (!appData) return null

  return (
    <Routes>
      <Route path="/"                       element={<RandomRedirect />} />
      <Route path="/compare/:slugA/:slugB"  element={<CompareView />} />
      <Route path="*"                       element={<Navigate to="/" replace />} />
    </Routes>
  )
}
