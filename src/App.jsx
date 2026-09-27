import { useLayoutEffect, useRef } from 'react'
import { Routes, Route, Navigate, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import PageShell from './components/Layout/PageShell'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import ContactUs from './pages/ContactUs'
import MaterialCompositionHeader from './components/MaterialCompositionHeader'
import CityDonutSection from './components/CityDonutSection'
import StateBarChart from './components/Charts/StateBarChart'
import { segmentToCityObj, cityObjToSegment, randomCityPair } from './utils/cityUrl'
import { FilterProvider } from './contexts/FilterContext'
import { useAppData } from './contexts/useAppData'
import styles from './App.module.css'

/** Renders nothing until the core data files have loaded. Static pages sit outside this gate. */
function DataGate() {
  const appData = useAppData()
  if (!appData) return null
  return <Outlet />
}

/**
 * Scroll to the top when moving between sections of the site (e.g. a footer
 * link to /about), but not when only the city pair changes inside /compare.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[1] ?? ''
  const prevSection = useRef(section)
  useLayoutEffect(() => {
    if (prevSection.current === section) return
    prevSection.current = section
    window.scrollTo(0, 0)
  }, [section])
  return null
}

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
  const accentColorB = perfA === 'better'
    ? 'var(--perf-worse)'
    : perfA === 'worse'
      ? 'var(--perf-better)'
      : 'var(--brand-600)'

  function handleBarChartCitySelect(newCityObj) {
    // Cycle: (A, B) + click C → (B, C)
    navigate(
      `/compare/${cityObjToSegment(jurisdictions, cityB)}/${cityObjToSegment(jurisdictions, newCityObj)}`,
      { replace: true }
    )
  }

  return (
    <PageShell>
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

          {/* Row 4: unified state bar chart — both cities highlighted, clicking cycles cityB */}
          <div className={styles.fullWidthSection}>
            <StateBarChart
              cityObj={cityA}
              accentColor={accentColorA}
              compareCityObj={cityB}
              compareAccentColor={accentColorB}
              onCitySelect={handleBarChartCitySelect}
            />
          </div>
        </Layout>
      </FilterProvider>
    </PageShell>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Static pages render immediately, without waiting on the data files */}
        <Route path="/about"      element={<PageShell><About /></PageShell>} />
        <Route path="/contact-us" element={<PageShell><ContactUs /></PageShell>} />

        <Route element={<DataGate />}>
          <Route path="/"                       element={<RandomRedirect />} />
          <Route path="/compare/:slugA/:slugB"  element={<CompareView />} />
          <Route path="*"                       element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}
