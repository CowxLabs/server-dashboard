import { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import clsx from 'clsx'
import { useTheme } from './contexts/ThemeContext'
import { useKeyboard } from './hooks/useKeyboard'
import { useSocket } from './hooks/useSocket'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './components/LoginPage'
import ConnectionBanner from './components/ConnectionBanner'
import ServiceManager from './components/ServiceManager'
import { useToast } from './contexts/ToastContext'

const SearchPalette = lazy(() => import('./components/SearchPalette'))
const CommandPalette = lazy(() => import('./components/CommandPalette'))
const SystemStats = lazy(() => import('./components/SystemStats'))
const ServiceCards = lazy(() => import('./components/ServiceCards'))
const QuickLinks = lazy(() => import('./components/QuickLinks'))
const NetworkChart = lazy(() => import('./components/NetworkChart'))
const ContainerList = lazy(() => import('./components/ContainerList'))
const AlertsFeed = lazy(() => import('./components/AlertsFeed'))
const ProcessList = lazy(() => import('./components/ProcessList'))
const StatusOverview = lazy(() => import('./components/StatusOverview'))
const StorageView = lazy(() => import('./components/StorageView'))
const SystemInfoPanel = lazy(() => import('./components/SystemInfoPanel'))
const ContainerStatsChart = lazy(() => import('./components/ContainerStatsChart'))
const ServiceUptimeChart = lazy(() => import('./components/ServiceUptimeChart'))
const DragDropDashboard = lazy(() => import('./components/DragDropDashboard'))

function Placeholder({ title }) {
  const { dark } = useTheme()
  return (
    <div className={clsx('rounded-2xl border p-16 text-center animate-fade-in', dark ? 'bg-[#161822]/80 border-[#252837]' : 'bg-white border-gray-200')}>
      <p className={clsx('text-lg font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{title}</p>
      <p className={clsx('text-sm mt-1', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Under development</p>
    </div>
  )
}

export default function App() {
  const { dark } = useTheme()
  const toast = useToast()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [cmdOpen, setCmdOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [svcManagerOpen, setSvcManagerOpen] = useState(false)
  const [sysInfoOpen, setSysInfoOpen] = useState(false)
  const [containerChart, setContainerChart] = useState(null)
  const [serviceChart, setServiceChart] = useState(null)
  const [widgetOrder, setWidgetOrder] = useState(['stats', 'services_containers', 'overview_network_alerts', 'quicklinks'])
  const [quickLinks, setQuickLinks] = useState([])
  const [token, setToken] = useState(() => localStorage.getItem('dashboard_token'))

  const { connected, reconnected, stats, services, containers, systemInfo, alerts } = useSocket()

  useEffect(() => {
    if (reconnected) toast.success('Reconnected to server')
  }, [reconnected, toast])

  useEffect(() => {
    if (!token) return
    fetch('/api/quicklinks', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setQuickLinks(data) })
      .catch(() => {})
  }, [token])

  const navigate = useCallback((section) => {
    setActiveSection(section)
    setMobileOpen(false)
  }, [])

  useKeyboard({
    'mod+k': () => setSearchOpen(o => !o),
    'escape': () => { setSearchOpen(false); setCmdOpen(false); setSysInfoOpen(false); setSvcManagerOpen(false); setContainerChart(null) },
    'shift+/': () => setCmdOpen(o => !o),
    'mod+i': () => setSysInfoOpen(o => !o),
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
        {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <div className={clsx('fixed lg:static z-40 h-full transition-transform duration-300 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar activeSection={activeSection} onNavigate={navigate}
            onOpenCommandPalette={() => { setCmdOpen(true); setMobileOpen(false) }}
            onOpenServiceManager={() => { setSvcManagerOpen(true); setMobileOpen(false) }}
            onOpenSystemInfo={() => { setSysInfoOpen(true); setMobileOpen(false) }} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ConnectionBanner connected={connected} />
          <Topbar onOpenCommandPalette={() => setCmdOpen(true)} onOpenSearch={() => setSearchOpen(true)}
            onToggleMobile={() => setMobileOpen(o => !o)} onLogout={handleLogout} alerts={alerts} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
              <Suspense fallback={<div className="h-40 rounded-2xl animate-pulse" style={{ background: dark ? '#161822' : '#f1f5f9' }} />}>
                {activeSection === 'dashboard' && (
                  <DragDropDashboard widgets={widgetOrder} onReorder={setWidgetOrder}>
                    {(id) => {
                      if (id === 'stats') return <SystemStats key="stats" stats={stats} systemInfo={systemInfo} />
                      if (id === 'services_containers') return (
                        <div key="svc" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                          <div className="xl:col-span-2 space-y-6">
                            <ServiceCards services={services} onServiceClick={setServiceChart} />
                            <ContainerList containers={containers} onContainerClick={setContainerChart} />
                          </div>
                          <div className="space-y-6">
                            <StatusOverview services={services} />
                            <NetworkChart stats={stats} />
                            <AlertsFeed alerts={alerts} />
                          </div>
                        </div>
                      )
                      if (id === 'overview_network_alerts') return (
                        <div key="net" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <NetworkChart stats={stats} />
                          <AlertsFeed alerts={alerts} />
                        </div>
                      )
                      if (id === 'quicklinks') return <QuickLinks key="ql" links={quickLinks} />
                      return null
                    }}
                  </DragDropDashboard>
                )}
                {activeSection === 'services' && <ServiceCards services={services} onServiceClick={setServiceChart} />}
                {activeSection === 'containers' && <ContainerList containers={containers} onContainerClick={setContainerChart} />}
                {activeSection === 'network' && <NetworkChart stats={stats} />}
                {activeSection === 'links' && <QuickLinks links={quickLinks} />}
                {activeSection === 'alerts' && <AlertsFeed alerts={alerts} />}
                {activeSection === 'storage' && <StorageView />}
                {activeSection === 'monitoring' && (
                  <div className="space-y-6">
                    <StatusOverview services={services} />
                    <NetworkChart stats={stats} />
                    <AlertsFeed alerts={alerts} />
                  </div>
                )}
              </Suspense>
            </div>
          </main>
        </div>

        {searchOpen && <SearchPalette onNavigate={navigate} onClose={() => setSearchOpen(false)} />}
        {cmdOpen && <CommandPalette onNavigate={navigate} onClose={() => setCmdOpen(false)} onOpenServiceManager={() => { setSvcManagerOpen(true); setCmdOpen(false) }} />}
        {svcManagerOpen && <ServiceManager onClose={() => setSvcManagerOpen(false)} />}
        {sysInfoOpen && <SystemInfoPanel onClose={() => setSysInfoOpen(false)} />}
        {containerChart && <ContainerStatsChart container={containerChart} onClose={() => setContainerChart(null)} />}
        {serviceChart && <ServiceUptimeChart service={serviceChart} onClose={() => setServiceChart(null)} />}
      </div>
    </ErrorBoundary>
  )
}
