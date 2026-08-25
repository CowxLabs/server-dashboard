import { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import clsx from 'clsx'
import { useTheme } from './contexts/ThemeContext'
import { useKeyboard } from './hooks/useKeyboard'
import { useSocket } from './hooks/useSocket'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './components/LoginPage'
import ConnectionBanner from './components/ConnectionBanner'
import ServiceManager from './components/ServiceManager'
import { quickLinks } from './data/mockData'

const SystemStats = lazy(() => import('./components/SystemStats'))
const ServiceCards = lazy(() => import('./components/ServiceCards'))
const QuickLinks = lazy(() => import('./components/QuickLinks'))
const NetworkChart = lazy(() => import('./components/NetworkChart'))
const ContainerList = lazy(() => import('./components/ContainerList'))
const AlertsFeed = lazy(() => import('./components/AlertsFeed'))
const ProcessList = lazy(() => import('./components/ProcessList'))
const StatusOverview = lazy(() => import('./components/StatusOverview'))
const StorageView = lazy(() => import('./components/StorageView'))

function Placeholder({ title }) {
  const { dark } = useTheme()
  return (
    <div className={clsx('rounded-2xl border p-16 text-center animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <p className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{title}</p>
      <p className={clsx('text-sm mt-1', dark ? 'text-[#5a6180]' : 'text-gray-400')}>This section is under development</p>
    </div>
  )
}

export default function App() {
  const { dark } = useTheme()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [cmdOpen, setCmdOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [svcManagerOpen, setSvcManagerOpen] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('dashboard_token'))

  const { connected, stats, services, containers, systemInfo } = useSocket()
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!token) return
    const fetchAlerts = () => {
      fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => setAlerts(data))
        .catch(() => {})
    }
    fetchAlerts()
    const iv = setInterval(fetchAlerts, 10000)
    return () => clearInterval(iv)
  }, [token])

  const navigate = useCallback((section) => {
    setActiveSection(section)
    setMobileOpen(false)
  }, [])

  useKeyboard({
    'mod+k': () => setCmdOpen(o => !o),
    'escape': () => setCmdOpen(false),
  })

  const handleLogout = useCallback(() => {
    localStorage.removeItem('dashboard_token')
    setToken(null)
  }, [])

  if (!token) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={setToken} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className={clsx('flex h-screen overflow-hidden', dark ? 'bg-[#0a0b10]' : 'bg-[#f8fafc]')}>
        {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <div className={clsx('fixed lg:static z-50 h-full transition-transform duration-300 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar activeSection={activeSection} onNavigate={navigate} onOpenCommandPalette={() => { setCmdOpen(true); setMobileOpen(false) }} onOpenServiceManager={() => { setSvcManagerOpen(true); setMobileOpen(false) }} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ConnectionBanner connected={connected} />
          <Topbar onOpenCommandPalette={() => setCmdOpen(true)} onToggleMobile={() => setMobileOpen(o => !o)} onLogout={handleLogout} alerts={alerts} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
              <Suspense fallback={<div className="h-40 rounded-2xl animate-pulse" style={{ background: dark ? '#161822' : '#f1f5f9' }} />}>
              {activeSection === 'dashboard' && (
                <>
                  <SystemStats stats={stats} systemInfo={systemInfo} />
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                      <ServiceCards services={services} />
                      <ContainerList containers={containers} />
                    </div>
                    <div className="space-y-6">
                      <StatusOverview services={services} />
                      <NetworkChart stats={stats} />
                      <AlertsFeed alerts={alerts} />
                    </div>
                  </div>
                  <QuickLinks links={quickLinks} />
                </>
              )}
              {activeSection === 'services' && <ServiceCards services={services} />}
              {activeSection === 'containers' && <ContainerList containers={containers} />}
              {activeSection === 'network' && <NetworkChart stats={stats} />}
              {activeSection === 'links' && <QuickLinks links={quickLinks} />}
              {activeSection === 'alerts' && <AlertsFeed alerts={alerts} />}
              {activeSection === 'monitoring' && (
                <div className="space-y-6">
                  <StatusOverview services={services} />
                  <NetworkChart stats={stats} />
                </div>
              )}
              {activeSection === 'storage' && <StorageView />}
              </Suspense>
            </div>
          </main>
        </div>

        {cmdOpen && <CommandPalette onNavigate={navigate} onClose={() => setCmdOpen(false)} onOpenServiceManager={() => { setSvcManagerOpen(true); setCmdOpen(false) }} />}
        {svcManagerOpen && <ServiceManager onClose={() => setSvcManagerOpen(false)} />}
      </div>
    </ErrorBoundary>
  )
}
