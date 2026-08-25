const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '..', 'dashboard.config.json')

const defaults = {
  title: 'Server Dashboard',
  refreshInterval: 3000,
  theme: 'dark',
  widgets: {
    systemStats: true,
    services: true,
    containers: true,
    network: true,
    processList: true,
    quickLinks: true,
    alerts: true,
    statusOverview: true,
  },
  services: [],
  quickLinks: [
    { name: 'Docker', url: 'http://localhost:9000', icon: '\u{1F4E6}', category: 'Infrastructure' },
    { name: 'Portainer', url: 'http://localhost:9000', icon: '\u{1F4E6}', category: 'Infrastructure' },
    { name: 'Grafana', url: 'http://localhost:3000', icon: '\u{1F4CA}', category: 'Monitoring' },
    { name: 'Prometheus', url: 'http://localhost:9090', icon: '\u{1F525}', category: 'Monitoring' },
  ],
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8')
      const custom = JSON.parse(raw)
      return { ...defaults, ...custom, widgets: { ...defaults.widgets, ...custom.widgets } }
    }
  } catch (err) {
    console.error('[Config] Failed to load config:', err.message)
  }
  return defaults
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch {
    return false
  }
}

module.exports = { loadConfig, saveConfig }
