import './App.css'
import { useTheme } from './contexts/ThemeContext'
import Layout from './components/Layout/Layout'
import SocialLayout from './components/Layout/SocialLayout'
import ThemeDevSwitcher from './components/ThemeDevSwitcher/ThemeDevSwitcher'
import Home from './pages/Home'

export default function App() {
  const { theme } = useTheme()

  return (
    <>
      {theme === 'social' ? (
        <SocialLayout />
      ) : (
        <Layout>
          <Home />
        </Layout>
      )}
      <ThemeDevSwitcher />
    </>
  )
}
