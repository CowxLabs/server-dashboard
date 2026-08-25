const http = require('http')
const https = require('https')
const net = require('net')
const fs = require('fs')
const path = require('path')
const db = require('./db.cjs')

const knownImages = {
  'nginx': { icon: '\u{1F310}', type: 'Web Server', protocol: 'http' },
  'nginx-proxy': { icon: '\u{1F310}', type: 'Web Server', protocol: 'http' },
  'apache': { icon: '\u{1F310}', type: 'Web Server', protocol: 'http' },
  'httpd': { icon: '\u{1F310}', type: 'Web Server', protocol: 'http' },
  'postgres': { icon: '\u{1F418}', type: 'Database', protocol: 'tcp' },
  'postgresql': { icon: '\u{1F418}', type: 'Database', protocol: 'tcp' },
  'mariadb': { icon: '\u{1F418}', type: 'Database', protocol: 'tcp' },
  'mysql': { icon: '\u{1F418}', type: 'Database', protocol: 'tcp' },
  'mongo': { icon: '\u{1F5C4}\uFE0F', type: 'Database', protocol: 'tcp' },
  'redis': { icon: '\u26A1', type: 'Cache', protocol: 'tcp' },
  'memcached': { icon: '\u26A1', type: 'Cache', protocol: 'tcp' },
  'elasticsearch': { icon: '\u{1F50D}', type: 'Search', protocol: 'http' },
  'rabbitmq': { icon: '\u{1F4E8}', type: 'Message Queue', protocol: 'http' },
  'grafana': { icon: '\u{1F4CA}', type: 'Observability', protocol: 'http' },
  'prometheus': { icon: '\u{1F525}', type: 'Metrics', protocol: 'http' },
  'portainer': { icon: '\u{1F4E6}', type: 'Container Management', protocol: 'http' },
  'traefik': { icon: '\u{1F500}', type: 'Reverse Proxy', protocol: 'http' },
  'caddy': { icon: '\u{1F500}', type: 'Reverse Proxy', protocol: 'http' },
  'plex': { icon: '\u{1F3AC}', type: 'Media Server', protocol: 'http' },
  'jellyfin': { icon: '\u{1F3AC}', type: 'Media Server', protocol: 'http' },
  'emby': { icon: '\u{1F3AC}', type: 'Media Server', protocol: 'http' },
  'sonarr': { icon: '\u{1F4FA}', type: 'TV Shows', protocol: 'http' },
  'radarr': { icon: '\u{1F3AC}', type: 'Movies', protocol: 'http' },
  'prowlarr': { icon: '\u{1F50D}', type: 'Indexer', protocol: 'http' },
  'transmission': { icon: '\u2B07}\uFE0F', type: 'Downloads', protocol: 'http' },
  'qbittorrent': { icon: '\u2B07}\uFE0F', type: 'Downloads', protocol: 'http' },
  'deluge': { icon: '\u2B07}\uFE0F', type: 'Downloads', protocol: 'http' },
  'jenkins': { icon: '\u{1F527}', type: 'CI/CD', protocol: 'http' },
  'gitlab': { icon: '\u{1F420}', type: 'CI/CD', protocol: 'http' },
  'gitea': { icon: '\u{1F420}', type: 'CI/CD', protocol: 'http' },
  'minio': { icon: '\u{1F4BE}', type: 'Object Storage', protocol: 'http' },
  'nextcloud': { icon: '\u2601\uFE0F', type: 'Cloud Storage', protocol: 'http' },
  'vaultwarden': { icon: '\u{1F510}', type: 'Password Manager', protocol: 'http' },
  'authentik': { icon: '\u{1F511}', type: 'SSO', protocol: 'http' },
  'pihole': { icon: '\u{1F6E1}\uFE0F', type: 'DNS / Ad Blocker', protocol: 'http' },
  'adguard': { icon: '\u{1F6E1}\uFE0F', type: 'DNS / Ad Blocker', protocol: 'http' },
  'wireguard': { icon: '\u{1F512}', type: 'VPN', protocol: 'tcp' },
  'openvpn': { icon: '\u{1F512}', type: 'VPN', protocol: 'tcp' },
  'home-assistant': { icon: '\u{1F3E1}', type: 'Automation', protocol: 'http' },
  'hassio': { icon: '\u{1F3E1}', type: 'Automation', protocol: 'http' },
  'nodebb': { icon: '\u{1F4AC}', type: 'Forum', protocol: 'http' },
  'wordpress': { icon: '\u{1F4DD}', type: 'CMS', protocol: 'http' },
  'outline': { icon: '\u{1F4DD}', type: 'Wiki', protocol: 'http' },
  'n8n': { icon: '\u{1F504}', type: 'Automation', protocol: 'http' },
  'uptime-kuma': { icon: '\u{1F4CA}', type: 'Uptime Monitor', protocol: 'http' },
  'dozzle': { icon: '\u{1F4CB}', type: 'Log Viewer', protocol: 'http' },
  'homepage': { icon: '\u{1F3E0}', type: 'Dashboard', protocol: 'http' },
}

const defaultServices = [
  { id: 'dashboard', name: 'Server Dashboard', icon: '\u{1F5A5}\uFE0F', type: 'Monitoring', protocol: 'http', url: 'http://localhost:4321', timeout: 3000 },
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
  return [...defaultServices]
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
    auto: service.auto || false,
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

let docker = null

function getDocker() {
  if (docker) return docker
  try {
    const Docker = require('dockerode')
    docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock', timeout: 5000 })
    return docker
  } catch {
    return null
  }
}

async function discoverDockerServices() {
  const d = getDocker()
  if (!d) return

  try {
    const containers = await d.listContainers({ all: false })
    const autoIds = new Set(services.filter(s => s.auto).map(s => s.id))

    for (const c of containers) {
      if (c.State !== 'running') continue

      const name = (c.Names[0] || '').replace(/^\//, '').replace(/-[0-9]+$/, '')
      const image = (c.Image || '').split('/').pop().split(':')[0].toLowerCase()

      const known = knownImages[image] || knownImages[name]
      if (!known) continue

      const httpPort = (c.Ports || []).find(p => p.Type === 'tcp' && (p.PrivatePort === 80 || p.PrivatePort === 443 || p.PrivatePort === 8080 || p.PrivatePort === 8443 || p.PrivatePort === 3000 || p.PrivatePort === 8096 || p.PrivatePort === 9000))
      const anyPort = (c.Ports || []).find(p => p.Type === 'tcp' && p.PublicPort)
      const port = httpPort || anyPort

      if (!port || !port.PublicPort) continue

      const id = `docker-${name}`
      if (autoIds.has(id)) continue

      const protocol = known.protocol || 'http'
      const url = protocol === 'http'
        ? `http://localhost:${port.PublicPort}`
        : `localhost:${port.PublicPort}`

      addService({
        id,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        icon: known.icon,
        type: known.type,
        protocol,
        url,
        timeout: 5000,
        auto: true,
      })

      console.log(`[Discovery] Added Docker service: ${name} on port ${port.PublicPort}`)
    }
  } catch (err) {
    console.error('[Discovery] Docker error:', err.message)
  }
}

async function checkAllServices() {
  await discoverDockerServices()
  const results = await Promise.all(services.map(s => checkService(s)))
  const uptimeStats = getUptimeStats()
  return results.map(r => ({
    ...r,
    uptime: uptimeStats[r.id]?.uptime || (r.status === 'healthy' ? 100 : 0),
  }))
}

module.exports = { checkAllServices, checkService, getAllServices, getUptimeStats, reloadServices, addService, updateService, removeService }
