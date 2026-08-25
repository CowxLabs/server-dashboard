const os = require('os')
const { execSync } = require('child_process')
const fs = require('fs')

let prevCpuInfo = null
let prevNetBytes = null

function getCpuUsage() {
  const cpus = os.cpus()
  let totalIdle = 0, totalTick = 0
  cpus.forEach(cpu => {
    for (const type in cpu.times) totalTick += cpu.times[type]
    totalIdle += cpu.times.idle
  })
  const current = { idle: totalIdle / cpus.length, total: totalTick / cpus.length }
  let usage = 0
  if (prevCpuInfo) {
    const idleDiff = current.idle - prevCpuInfo.idle
    const totalDiff = current.total - prevCpuInfo.total
    usage = totalDiff > 0 ? Math.round(((totalDiff - idleDiff) / totalDiff) * 1000) / 10 : 0
  }
  prevCpuInfo = current
  return Math.max(0, Math.min(100, usage))
}

function getMemoryInfo() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  return {
    total: Math.round(total / 1024 / 1024 / 1024 * 10) / 10,
    used: Math.round(used / 1024 / 1024 / 1024 * 10) / 10,
    percent: Math.round((used / total) * 1000) / 10,
  }
}

function getDiskInfo() {
  try {
    if (process.platform === 'win32') {
      const raw = execSync('powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"', { encoding: 'utf8', timeout: 5000 })
      const info = JSON.parse(raw.trim())
      const used = (info.Used || 0) / 1073741824
      const free = (info.Free || 0) / 1073741824
      const total = used + free
      return { total: Math.round(total), used: Math.round(used), percent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0 }
    }
    const raw = execSync('df -B1 / | tail -1', { encoding: 'utf8', timeout: 5000 })
    const parts = raw.trim().split(/\s+/)
    const total = parseInt(parts[1]) || 0
    const used = parseInt(parts[2]) || 0
    return { total: Math.round(total / 1073741824), used: Math.round(used / 1073741824), percent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0 }
  } catch { return { total: 0, used: 0, percent: 0 } }
}

function getNetworkInfo() {
  const interfaces = os.networkInterfaces()
  let rx = 0, tx = 0
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        try {
          if (process.platform === 'linux') {
            const rxFile = `/sys/class/net/${name}/statistics/rx_bytes`
            const txFile = `/sys/class/net/${name}/statistics/tx_bytes`
            if (fs.existsSync(rxFile)) rx += parseInt(fs.readFileSync(rxFile, 'utf8')) || 0
            if (fs.existsSync(txFile)) tx += parseInt(fs.readFileSync(txFile, 'utf8')) || 0
          }
        } catch {}
      }
    }
  }
  let rxSpeed = 0, txSpeed = 0
  if (prevNetBytes) {
    rxSpeed = Math.max(0, rx - prevNetBytes.rx)
    txSpeed = Math.max(0, tx - prevNetBytes.tx)
  }
  prevNetBytes = { rx, tx }
  return { rx, tx, rxSpeed, txSpeed }
}

function getTemperature() {
  try {
    if (process.platform === 'linux') {
      const raw = execSync('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo 0', { encoding: 'utf8', timeout: 3000 })
      return Math.round(parseInt(raw.trim()) / 100)
    }
  } catch {}
  return null
}

function getLoadAverage() {
  const loads = os.loadavg()
  return loads.map(l => Math.round(l * 100) / 100)
}

function getSystemInfo() {
  let hostname = os.hostname()
  try {
    const hostHostname = fs.readFileSync('/etc/hostname', 'utf8').trim()
    if (hostHostname) hostname = hostHostname
  } catch {}
  if (process.env.HOSTNAME) hostname = process.env.HOSTNAME

  return {
    hostname,
    os: `${os.type()} ${os.release()}`,
    platform: os.platform(),
    arch: os.arch(),
    kernel: os.release(),
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    cpuCores: os.cpus().length,
    uptime: os.uptime(),
    gateway: null,
    loadAverage: getLoadAverage(),
  }
}

function collectStats() {
  return {
    cpu: getCpuUsage(),
    memory: getMemoryInfo(),
    disk: getDiskInfo(),
    network: getNetworkInfo(),
    temperature: getTemperature(),
    loadAverage: getLoadAverage(),
    timestamp: new Date().toISOString(),
  }
}

module.exports = { collectStats, getSystemInfo, getCpuUsage, getMemoryInfo, getDiskInfo, getNetworkInfo, getTemperature, getLoadAverage }
