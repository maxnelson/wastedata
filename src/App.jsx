import { useState } from 'react'
import './App.css'
import { useTheme } from './contexts/ThemeContext'
import AppHeader from './components/Layout/AppHeader'
import Footer from './components/Layout/Footer'
import Layout from './components/Layout/Layout'
import SocialLayout from './components/Layout/SocialLayout'
import Home from './pages/Home'
import styles from './App.module.css'

export default function App() {
  const { theme } = useTheme()
  const [cityA, setCityA] = useState('Berkeley')
  const [cityB, setCityB] = useState('Oakland')

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
          <SocialLayout cityA={cityA} cityB={cityB} />
        ) : (
          <Layout>
            <Home />
          </Layout>
        )}
      </div>
      <Footer />
    </div>
  )
}
