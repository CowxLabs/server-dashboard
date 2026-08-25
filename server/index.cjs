require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const path = require('path')

const { collectStats, getSystemInfo } = require('./stats.cjs')
const { getContainers, getDockerInfo } = require('./docker.cjs')
const { checkAllServices, getAllServices, checkService, reloadServices, addService, updateService, removeService } = require('./healthcheck.cjs')
const db = require('./db.cjs')
const { authMiddleware, loginHandler, sanitizeMiddleware } = require('./auth.cjs')
const { loadConfig, saveConfig } = require('./config.cjs')
const { loginLimiter, apiLimiter, writeLimiter, checkBruteForce, resetBruteForce } = require('./ratelimit.cjs')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || true, methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
})
const isProduction = process.env.NODE_ENV === 'production'

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))
app.use(compression())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
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

// Login with brute force protection
app.post('/api/login', loginLimiter, (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown'
  if (checkBruteForce(ip)) {
    return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts' })
  }
  const originalSend = res.json.bind(res)
  res.json = (data) => {
    if (res.statusCode === 200) resetBruteForce(ip)
    return originalSend(data)
  }
  next()
}, loginHandler)

// Protected API routes
app.get('/api/stats', apiLimiter, authMiddleware, (req, res) => res.json(collectStats()))
app.get('/api/system', apiLimiter, authMiddleware, (req, res) => res.json(systemInfo))
app.get('/api/services', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await checkAllServices())))
app.get('/api/services/config', apiLimiter, authMiddleware, (req, res) => res.json(getAllServices()))
app.get('/api/docker', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await getContainers())))
app.get('/api/docker/info', apiLimiter, authMiddleware, asyncHandler(async (req, res) => res.json(await getDockerInfo())))
app.get('/api/storage', apiLimiter, authMiddleware, (req, res) => {
  const { execSync } = require('child_process')
  const os = require('os')
  const disks = []

  try {
    if (process.platform === 'win32') {
      const raw = execSync('powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free | ConvertTo-Json"', { encoding: 'utf8', timeout: 5000 })
      const drives = JSON.parse(raw.trim())
      const arr = Array.isArray(drives) ? drives : [drives]
      for (const d of arr) {
        const used = (d.Used || 0) / 1073741824
        const free = (d.Free || 0) / 1073741824
        const total = used + free
        if (total > 0) {
          disks.push({ device: d.Name + ':', mount: d.Name + ':\\', total: Math.round(total * 10) / 10, used: Math.round(used * 10) / 10, free: Math.round(free * 10) / 10, percent: Math.round((used / total) * 1000) / 10, type: 'local' })
        }
      }
    } else {
      const raw = execSync('df -h --output=source,fstype,size,used,avail,pcent,target 2>/dev/null | grep -E "^/dev/"', { encoding: 'utf8', timeout: 5000 })
      const lines = raw.trim().split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 7) {
          disks.push({
            device: parts[0],
            type: parts[1] === 'overlay' ? 'overlay' : parts[1],
            total: parseFloat(parts[2]) || 0,
            used: parseFloat(parts[3]) || 0,
            free: parseFloat(parts[4]) || 0,
            percent: parseFloat(parts[5]) || 0,
            mount: parts[6],
          })
        }
      }
      if (disks.length === 0) {
        const raw2 = execSync('df -h / | tail -1', { encoding: 'utf8', timeout: 5000 })
        const p = raw2.trim().split(/\s+/)
        disks.push({ device: p[0], type: 'local', total: p[1], used: p[2], free: p[3], percent: parseFloat(p[4]) || 0, mount: p[5] })
      }
    }
  } catch {}

  const memTotal = os.totalmem() / 1073741824
  const memFree = os.freemem() / 1073741824
  const memUsed = memTotal - memFree

  res.json({
    disks,
    memory: { total: Math.round(memTotal * 10) / 10, used: Math.round(memUsed * 10) / 10, free: Math.round(memFree * 10) / 10, percent: Math.round((memUsed / memTotal) * 1000) / 10 },
  })
})
app.get('/api/config', apiLimiter, authMiddleware, (req, res) => res.json(appConfig))

app.post('/api/config', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  appConfig = { ...appConfig, ...req.body, widgets: { ...appConfig.widgets, ...req.body.widgets } }
  const ok = saveConfig(appConfig)
  if (req.body.services) reloadServices()
  io.emit('config', appConfig)
  res.json({ success: ok })
})

app.post('/api/services', apiLimiter, writeLimiter, authMiddleware, (req, res) => {
  const { id, name, icon, type, protocol, url, timeout } = req.body
  if (!id || !name || !url) return res.status(400).json({ error: 'id, name, and url are required' })
  if (!/^[a-z0-9-]+$/.test(id)) return res.status(400).json({ error: 'id must be lowercase alphanumeric with hyphens only' })
  if (id.length > 50) return res.status(400).json({ error: 'id too long (max 50 chars)' })
  if (name.length > 100) return res.status(400).json({ error: 'name too long (max 100 chars)' })
  const svc = addService({ id, name, icon, type, protocol, url, timeout: parseInt(timeout) || 5000 })
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
    const services = await checkAllServices()
    const containers = await getContainers()

    db.prepare('INSERT INTO stats_history (cpu, memory, disk, net_rx, net_tx) VALUES (?, ?, ?, ?, ?)').run(
      stats.cpu, stats.memory.percent, stats.disk.percent, stats.network.rxSpeed, stats.network.txSpeed
    )

    io.emit('stats', stats)
    io.emit('services', services)
    io.emit('containers', containers)

    lastStats = stats
    lastServices = services
    lastContainers = containers
  } catch (err) {
    console.error(`[BROADCAST ERROR] ${err.message}`)
  }
}

io.on('connection', (socket) => {
  console.log(`[WS] Connected: ${socket.id}`)
  socket.emit('stats', lastStats)
  socket.emit('services', lastServices)
  socket.emit('containers', lastContainers)
  socket.emit('systemInfo', systemInfo)
  socket.emit('config', appConfig)

  socket.on('checkService', async (serviceId) => {
    const services = getAllServices()
    const svc = services.find(s => s.id === serviceId)
    if (svc) {
      const result = await checkService(svc)
      socket.emit('serviceUpdate', result)
    }
  })

  socket.on('disconnect', () => console.log(`[WS] Disconnected: ${socket.id}`))
})

const interval = parseInt(process.env.CHECK_INTERVAL) || 5000
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
})

const PORT = process.env.PORT || 4321
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Server Dashboard v2.0`)
  console.log(`  Running on http://localhost:${PORT}`)
  console.log(`  Health: http://localhost:${PORT}/health`)
  console.log(`  Mode: ${isProduction ? 'production' : 'development'}\n`)
})
