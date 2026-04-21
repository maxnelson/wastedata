import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
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

  return (
    <div className={styles.root}>
      <AppHeader />
      <div className={styles.body}>
        <FilterProvider>
        <Layout>
          <div className={`${styles.panels} ${styles.comparing}`}>
            <div className={styles.panelA}>
              <Home
                city={cityA.city}
                cityObj={cityA}
                onCityChange={handleCityAChange}
                excludeCity={cityB}
                vsPerCapita={perCapitaB}
              />
            </div>
            <div className={`${styles.panelB} ${styles.panelBActive}`}>
              <Home
                city={cityB.city}
                cityObj={cityB}
                onCityChange={handleCityBChange}
                excludeCity={cityA}
                vsPerCapita={perCapitaA}
              />
            </div>
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
