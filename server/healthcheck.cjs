const http = require('http')
const https = require('https')
const net = require('net')
const fs = require('fs')
const path = require('path')
const db = require('./db.cjs')

const defaultServices = [
  { id: 'nginx', name: 'Nginx', icon: '\u{1F310}', type: 'Web Server', protocol: 'http', url: 'http://localhost:80', timeout: 5000 },
  { id: 'postgresql', name: 'PostgreSQL', icon: '\u{1F418}', type: 'Database', protocol: 'tcp', url: 'localhost:5432', timeout: 3000 },
  { id: 'redis', name: 'Redis', icon: '\u26A1', type: 'Cache', protocol: 'tcp', url: 'localhost:6379', timeout: 3000 },
  { id: 'docker', name: 'Docker Engine', icon: '\u{1F433}', type: 'Container Runtime', protocol: 'tcp', url: 'localhost:2375', timeout: 3000 },
  { id: 'plex', name: 'Plex', icon: '\u{1F3AC}', type: 'Media Server', protocol: 'http', url: 'http://localhost:32400', timeout: 5000 },
  { id: 'portainer', name: 'Portainer', icon: '\u{1F4E6}', type: 'Container Management', protocol: 'http', url: 'http://localhost:9000', timeout: 5000 },
  { id: 'grafana', name: 'Grafana', icon: '\u{1F4CA}', type: 'Observability', protocol: 'http', url: 'http://localhost:3000', timeout: 5000 },
  { id: 'prometheus', name: 'Prometheus', icon: '\u{1F525}', type: 'Metrics', protocol: 'http', url: 'http://localhost:9090', timeout: 5000 },
  { id: 'homepage', name: 'Homepage', icon: '\u{1F3E0}', type: 'Dashboard', protocol: 'http', url: 'http://localhost:3001', timeout: 5000 },
  { id: 'wireguard', name: 'WireGuard', icon: '\u{1F512}', type: 'VPN', protocol: 'tcp', url: 'localhost:51820', timeout: 3000 },
  { id: 'traefik', name: 'Traefik', icon: '\u{1F500}', type: 'Reverse Proxy', protocol: 'http', url: 'http://localhost:8080', timeout: 5000 },
]

function loadServices() {
  try {
    const configPath = path.join(__dirname, '..', 'dashboard.config.json')
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8')
      const config = JSON.parse(raw)
      if (Array.isArray(config.services) && config.services.length > 0) {
        return config.services.map(s => ({ ...defaultServices.find(d => d.id === s.id) || {}, ...s }))
      }
    }
  } catch {}
  return defaultServices
}

let services = loadServices()

function checkHttp(url, timeout) {
  return new Promise((resolve) => {
    const start = Date.now()
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout }, (res) => {
      res.resume()
      resolve({ up: res.statusCode < 500, responseMs: Date.now() - start, statusCode: res.statusCode })
    })
    req.on('error', () => resolve({ up: false, responseMs: Date.now() - start, error: true }))
    req.on('timeout', () => { req.destroy(); resolve({ up: false, responseMs: timeout, error: true }) })
  })
}

function checkTcp(hostPort, timeout) {
  return new Promise((resolve) => {
    const start = Date.now()
    const [host, port] = hostPort.split(':')
    const sock = new net.Socket()
    sock.setTimeout(timeout)
    sock.on('connect', () => { sock.destroy(); resolve({ up: true, responseMs: Date.now() - start }) })
    sock.on('timeout', () => { sock.destroy(); resolve({ up: false, responseMs: timeout, error: true }) })
    sock.on('error', () => { sock.destroy(); resolve({ up: false, responseMs: Date.now() - start, error: true }) })
    sock.connect(parseInt(port), host)
  })
}

const insertHistory = db.prepare('INSERT INTO uptime_history (service_id, status, response_ms) VALUES (?, ?, ?)')
const insertAlert = db.prepare('INSERT INTO alerts (severity, message, service, source) VALUES (?, ?, ?, ?)')
const getHistory = db.prepare('SELECT * FROM uptime_history WHERE service_id = ? ORDER BY checked_at DESC LIMIT ?')
const getUptime = db.prepare(`
  SELECT
    service_id,
    COUNT(CASE WHEN status = 'healthy' THEN 1 END) * 100.0 / COUNT(*) as uptime_percent,
    AVG(response_ms) as avg_response
  FROM uptime_history
  WHERE checked_at > datetime('now', '-24 hours')
  GROUP BY service_id
`)

let lastStatuses = {}

async function checkService(service) {
  const result = service.protocol === 'http'
    ? await checkHttp(service.url, service.timeout)
    : await checkTcp(service.url, service.timeout)

  const status = result.up ? 'healthy' : 'degraded'
  const prev = lastStatuses[service.id]
  lastStatuses[service.id] = status

  insertHistory.run(service.id, status, result.responseMs)

  if (prev === 'healthy' && status === 'degraded') {
    insertAlert.run('critical', `${service.name} is down (was healthy)`, service.name, 'Health Check')
  } else if (prev === 'degraded' && status === 'healthy') {
    insertAlert.run('info', `${service.name} recovered`, service.name, 'Health Check')
  }

  return {
    ...service,
    status,
    responseTime: result.responseMs,
    lastChecked: 'just now',
    heartbeat: generateHeartbeat(service.id),
    latencyHistory: getLatencyHistory(service.id),
  }
}

function generateHeartbeat(serviceId) {
  const rows = getHistory.all(serviceId, 30)
  while (rows.length < 30) rows.unshift({ status: 'unknown', response_ms: 0 })
  return rows.slice(-30).map(r => r.status === 'healthy' ? 1 : 0)
}

function getLatencyHistory(serviceId) {
  const rows = getHistory.all(serviceId, 30)
  return rows.slice().reverse().map(r => r.response_ms || 0)
}

function getUptimeStats() {
  const rows = getUptime.all()
  const map = {}
  for (const r of rows) {
    map[r.service_id] = { uptime: Math.round(r.uptime_percent * 10) / 10, avgResponse: Math.round(r.avg_response) }
  }
  return map
}

function getAllServices() { return services }

function reloadServices() { services = loadServices() }

function addService(service) {
  const exists = services.find(s => s.id === service.id)
  if (exists) return null
  const newSvc = {
    id: service.id,
    name: service.name || service.id,
    icon: service.icon || '\u{1F50C}',
    type: service.type || 'Custom',
    protocol: service.protocol || 'http',
    url: service.url || 'http://localhost:8080',
    timeout: service.timeout || 5000,
  }
  services.push(newSvc)
  return newSvc
}

function updateService(id, updates) {
  const idx = services.findIndex(s => s.id === id)
  if (idx === -1) return null
  services[idx] = { ...services[idx], ...updates, id }
  return services[idx]
}

function removeService(id) {
  const idx = services.findIndex(s => s.id === id)
  if (idx === -1) return null
  const removed = services.splice(idx, 1)[0]
  try {
    db.prepare('DELETE FROM uptime_history WHERE service_id = ?').run(id)
  } catch {}
  return removed
}

async function checkAllServices() {
  const results = await Promise.all(services.map(s => checkService(s)))
  const uptimeStats = getUptimeStats()
  return results.map(r => ({
    ...r,
    uptime: uptimeStats[r.id]?.uptime || (r.status === 'healthy' ? 100 : 0),
  }))
}

module.exports = { checkAllServices, checkService, getAllServices, getUptimeStats, reloadServices, addService, updateService, removeService }
