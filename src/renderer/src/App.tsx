import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Targets } from './pages/Targets'
import { Reports } from './pages/Reports'
import { ReportDetail } from './pages/ReportDetail'
import { Bounties } from './pages/Bounties'
import { Monthly } from './pages/Monthly'
import { Workflows } from './pages/Workflows'
import { Statistics } from './pages/Statistics'
import { Settings } from './pages/Settings'
import { useThemeStore } from './store/theme'

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/companies" element={<Navigate to="/targets" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/bounties" element={<Bounties />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
