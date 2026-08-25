require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const path = require('path')
const { exec, execSync } = require('child_process')
const { promisify } = require('util')
const os = require('os')

const execAsync = promisify(exec)

const { collectStats, getSystemInfo } = require('./stats.cjs')
const { getContainers, getDockerInfo } = require('./docker.cjs')
const { checkAllServices, getAllServices, checkService, reloadServices, addService, updateService, removeService } = require('./healthcheck.cjs')
const db = require('./db.cjs')
const { authMiddleware, loginHandler, sanitizeMiddleware, verifyToken } = require('./auth.cjs')
const { loadConfig, saveConfig } = require('./config.cjs')
const { loginLimiter, apiLimiter, writeLimiter, checkBruteForce, resetBruteForce } = require('./ratelimit.cjs')

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-production')) {
  console.error('[WARN] JWT_SECRET should be set to a strong random value in production')
}
if (isProduction && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin')) {
  console.error('[WARN] ADMIN_PASSWORD should be set to a strong value in production')
}

const app = express()
const server = http.createServer(app)

const corsOrigin = process.env.CORS_ORIGIN || '*'
const io = new Server(server, {
  cors: { origin: corsOrigin === '*' ? true : corsOrigin.split(','), methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
})

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Authentication required'))
  const decoded = verifyToken(token)
  if (!decoded) return next(new Error('Invalid token'))
  socket.user = decoded
  next()
})

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(compression())
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(','), credentials: corsOrigin !== '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(sanitizeMiddleware)

let appConfig = loadConfig()
const systemInfo = getSystemInfo()
const startTime = Date.now()

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000), timestamp: new Date().toISOString() })
})

// Login with rate limiting
app.post('/api/login', loginLimiter, loginHandler)

// Protected API routes
app.get('/api/stats', apiLimiter, authMiddleware, (req, res) => res.json(collectStats()))
app.get('/api/system', apiLimiter, authMiddleware, (req, res) => res.json(systemInfo))
app.get('/api/services', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await checkAllServices())))
app.get('/api/services/config', apiLimiter, authMiddleware, (req, res) => res.json(getAllServices()))
app.get('/api/docker', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await getContainers())))
app.get('/api/docker/info', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await getDockerInfo())))
app.get('/api/storage', apiLimiter, authMiddleware, (req, res) => {
  const disks = []

  try {
    if (process.platform !== 'win32') {
      let raw = ''
      try { raw = execSync('df -h 2>/dev/null', { encoding: 'utf8', timeout: 3000 }) } catch {}
      if (raw) {
        const lines = raw.trim().split('\n').slice(1)
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 6) {
            const device = parts[0]
            if (device === 'tmpfs' || device === 'udev' || device === 'devtmpfs' || device.startsWith('overlay') && parts.length < 7) continue
            const total = parts[1] || '0'
            const used = parts[2] || '0'
            const free = parts[3] || '0'
            const percent = parseInt(parts[4]) || 0
            const mount = parts[5] || '/'
            const existing = disks.find(d => d.mount === mount)
            if (!existing) {
              disks.push({ device, mount, total, used, free, percent, type: device.includes('overlay') ? 'overlay' : device.includes('sd') ? 'disk' : device.includes('nvme') ? 'nvme' : 'local' })
            }
          }
        }
      }
      if (disks.length === 0) {
        try {
          const raw2 = execSync('df -h / | tail -1', { encoding: 'utf8', timeout: 3000 })
          const p = raw2.trim().split(/\s+/)
          if (p.length >= 6) {
            disks.push({ device: p[0], mount: p[5], total: p[1], used: p[2], free: p[3], percent: parseInt(p[4]) || 0, type: 'local' })
          }
        } catch {}
      }
    }
  } catch {}

  const memTotal = os.totalmem() / 1073741824
  const memFree = os.freemem() / 1073741824
  const memUsed = memTotal - memFree

  res.json({
    disks,
    memory: { total: Math.round(memTotal * 10) / 10, used: Math.round(memUsed * 10) / 10, free: Math.round(memFree * 10) / 10, percent: Math.round(memUsed / memTotal * 1000) / 10 },
  })
})
app.get('/api/search', apiLimiter, authMiddleware, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim()
  if (!q) return res.json({ services: [], containers: [], quickLinks: [] })

  const svcResults = getAllServices().filter(s => s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5)
  const qlResults = (appConfig.quickLinks || []).filter(l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)).slice(0, 5)

  res.json({ services: svcResults, quickLinks: qlResults })
})
app.get('/api/quicklinks', apiLimiter, authMiddleware, (req, res) => {
  res.json(appConfig.quickLinks || [])
})
app.get('/api/container-stats/:name', apiLimiter, authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 60, 720)
  const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, '')
  const rows = db.prepare('SELECT * FROM container_stats WHERE container_name = ? ORDER BY recorded_at DESC LIMIT ?').all(name, limit)
  res.json(rows)
})
app.get('/api/system/full', apiLimiter, authMiddleware, (req, res) => {
  const { execSync } = require('child_process')
  const info = { ...systemInfo, interfaces: {}, storage: [] }
  try {
    const ifaces = os.networkInterfaces()
    for (const name in ifaces) {
      info.interfaces[name] = ifaces[name].filter(i => !i.internal && i.family === 'IPv4').map(i => ({ address: i.address, netmask: i.netmask, mac: i.mac }))
    }
  } catch {}
  try {
    if (process.platform !== 'win32') {
      const raw = execSync('cat /proc/cpuinfo | head -20 2>/dev/null', { encoding: 'utf8', timeout: 2000 })
      const model = raw.match(/model name\s*:\s*(.+)/i)
      const mhz = raw.match(/cpu MHz\s*:\s*(.+)/i)
      if (model) info.cpuModel = model[1].trim()
      if (mhz) info.cpuFrequency = Math.round(parseFloat(mhz[1])) + ' MHz'
      try {
        const memRaw = execSync('free -b | grep Mem', { encoding: 'utf8', timeout: 2000 })
        const parts = memRaw.trim().split(/\s+/)
        info.memoryDetail = { total: parseInt(parts[1]), used: parseInt(parts[2]), free: parseInt(parts[3]), shared: parseInt(parts[4]), buffers: parseInt(parts[5]), available: parseInt(parts[6]) }
      } catch {}
    }
  } catch {}
  res.json(info)
})
app.get('/api/config', apiLimiter, authMiddleware, (req, res) => res.json(appConfig))

app.post('/api/config', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const { title, refreshInterval, theme, widgets, quickLinks } = req.body
  appConfig = {
    ...appConfig,
    ...(title && { title }),
    ...(refreshInterval && { refreshInterval: Math.max(parseInt(refreshInterval) || 3000, 1000) }),
    ...(theme && { theme }),
    ...(widgets && { widgets: { ...appConfig.widgets, ...widgets } }),
    ...(Array.isArray(quickLinks) && { quickLinks }),
  }
  const ok = saveConfig(appConfig)
  io.emit('config', appConfig)
  res.json({ success: ok })
})

app.post('/api/services', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const { id, name, icon, type, protocol, url, timeout } = req.body
  if (!id || !name || !url) return res.status(400).json({ error: 'id, name, and url are required' })
  if (!/^[a-z0-9-]+$/.test(id)) return res.status(400).json({ error: 'id must be lowercase alphanumeric with hyphens only' })
  if (id.length > 50) return res.status(400).json({ error: 'id too long (max 50 chars)' })
  if (name.length > 100) return res.status(400).json({ error: 'name too long (max 100 chars)' })
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol) && protocol !== 'tcp') throw new Error()
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' })
  }
  const svc = addService({ id, name, icon, type, protocol: protocol || 'http', url, timeout: parseInt(timeout) || 5000 })
  if (!svc) return res.status(409).json({ error: 'Service with this ID already exists' })
  appConfig.services = getAllServices()
  saveConfig(appConfig)
  io.emit('config', appConfig)
  res.status(201).json(svc)
})

app.put('/api/services/:id', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const svc = updateService(req.params.id, req.body)
  if (!svc) return res.status(404).json({ error: 'Service not found' })
  appConfig.services = getAllServices()
  saveConfig(appConfig)
  io.emit('config', appConfig)
  res.json(svc)
})

app.delete('/api/services/:id', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const svc = removeService(req.params.id)
  if (!svc) return res.status(404).json({ error: 'Service not found' })
  appConfig.services = getAllServices()
  saveConfig(appConfig)
  io.emit('config', appConfig)
  res.json({ success: true, removed: svc.id })
})

app.get('/api/alerts', apiLimiter, authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200)
  const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?').all(limit)
  res.json(rows)
})

app.post('/api/alerts/:id/ack', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const id = parseInt(req.params.id)
  if (!id || !isFinite(id)) return res.status(400).json({ error: 'Invalid alert ID' })
  db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(id)
  res.json({ success: true })
})

app.get('/api/uptime/:serviceId', apiLimiter, authMiddleware, (req, res) => {
  const hours = Math.min(parseInt(req.query.hours) || 24, 168)
  const serviceId = req.params.serviceId.replace(/[^a-z0-9-]/g, '')
  const rows = db.prepare(`
    SELECT status, response_ms, checked_at
    FROM uptime_history
    WHERE service_id = ? AND checked_at > datetime('now', ? || ' hours')
    ORDER BY checked_at ASC
  `).all(serviceId, -hours)
  res.json(rows)
})

app.get('/api/stats/history', apiLimiter, authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 60, 1440)
  const rows = db.prepare('SELECT * FROM stats_history ORDER BY recorded_at DESC LIMIT ?').all(limit)
  res.json(rows)
})

app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.path}: ${err.message}`)
  res.status(500).json({ error: 'Internal server error' })
})

let lastStats = {}
let lastServices = []
let lastContainers = []

async function broadcastAll() {
  try {
    const stats = collectStats()
    io.emit('stats', stats)
    lastStats = stats
    try {
      db.prepare('INSERT INTO stats_history (cpu, memory, disk, net_rx, net_tx) VALUES (?, ?, ?, ?, ?)').run(
        stats.cpu, stats.memory.percent, stats.disk.percent, stats.network.rxSpeed, stats.network.txSpeed
      )
    } catch {}
  } catch (err) {
    console.error(`[BROADCAST] Stats error: ${err.message}`)
  }

  try {
    const services = await checkAllServices()
    io.emit('services', services)
    lastServices = services
  } catch (err) {
    console.error(`[BROADCAST] Services error: ${err.message}`)
  }

  try {
    const containers = await getContainers()
    io.emit('containers', containers)
    lastContainers = containers
    for (const c of containers) {
      if (c.status === 'running') {
        try {
          db.prepare('INSERT INTO container_stats (container_id, container_name, cpu, memory, network_rx, network_tx) VALUES (?, ?, ?, ?, ?, ?)').run(
            c.id, c.name, c.cpu || 0, c.memory || 0, c.networkRx || 0, c.networkTx || 0
          )
        } catch {}
      }
    }
  } catch (err) {
    console.error(`[BROADCAST] Containers error: ${err.message}`)
  }

  try {
    io.emit('alerts', db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 20').all())
  } catch {}
}

io.on('connection', (socket) => {
  console.log(`[WS] Connected: ${socket.id}`)
  socket.emit('stats', lastStats)
  socket.emit('services', lastServices)
  socket.emit('containers', lastContainers)
  socket.emit('systemInfo', systemInfo)
  socket.emit('config', appConfig)

  let checking = false
  socket.on('checkService', async (serviceId) => {
    if (checking) return
    checking = true
    try {
      const services = getAllServices()
      const svc = services.find(s => s.id === serviceId)
      if (svc) {
        const result = await checkService(svc)
        socket.emit('serviceUpdate', result)
      }
    } catch {}
    checking = false
  })

  socket.on('disconnect', () => console.log(`[WS] Disconnected: ${socket.id}`))
})

const interval = Math.max(parseInt(process.env.CHECK_INTERVAL) || 5000, 1000)
const broadcastTimer = setInterval(broadcastAll, interval)
broadcastAll()

function shutdown(signal) {
  console.log(`\n[SHUTDOWN] ${signal} received, cleaning up...`)
  clearInterval(broadcastTimer)
  io.emit('shutdown', { reason: signal })
  io.close()
  server.close(() => {
    db.close()
    console.log('[SHUTDOWN] Server stopped')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced exit after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('uncaughtException', (err) => {
  console.error(`[FATAL] Uncaught exception: ${err.message}`)
  console.error(err.stack)
  shutdown('uncaughtException')
})
process.on('unhandledRejection', (reason) => {
  console.error(`[FATAL] Unhandled rejection: ${reason}`)
  if (isProduction) shutdown('unhandledRejection')
})

const PORT = process.env.PORT || 4321
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Server Dashboard v2.0`)
  console.log(`  Running on http://localhost:${PORT}`)
  console.log(`  Health: http://localhost:${PORT}/health`)
  console.log(`  Mode: ${isProduction ? 'production' : 'development'}\n`)
})
