import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import { MOCK_DATA } from './data/cities'
import { segmentToCityObj, cityObjToSegment, randomCityPair } from './utils/cityUrl'
import { FilterProvider } from './contexts/FilterContext'
import styles from './App.module.css'

/** Picks two random cities and redirects immediately. */
function RandomRedirect() {
  const [a, b] = randomCityPair()
  return <Navigate to={`/compare/${cityObjToSegment(a)}/${cityObjToSegment(b)}`} replace />
}

/** Main comparison view — city state lives entirely in the URL. */
function CompareView() {
  const { slugA, slugB } = useParams()
  const navigate = useNavigate()

  const cityA = segmentToCityObj(slugA)
  const cityB = segmentToCityObj(slugB)

  // Unknown slugs → start over with random cities
  if (!cityA || !cityB) return <Navigate to="/" replace />

  function handleCityAChange(newCity) {
    navigate(`/compare/${cityObjToSegment(newCity)}/${slugB}`, { replace: true })
  }
  function handleCityBChange(newCity) {
    navigate(`/compare/${slugA}/${cityObjToSegment(newCity)}`, { replace: true })
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
          <Footer />
        </Layout>
        </FilterProvider>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                       element={<RandomRedirect />} />
      <Route path="/compare/:slugA/:slugB"  element={<CompareView />} />
      <Route path="*"                       element={<Navigate to="/" replace />} />
    </Routes>
  )
}
