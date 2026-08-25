const Docker = require('dockerode')

let docker = null
let lastAttempt = 0
const RETRY_INTERVAL = 30000

function getDocker() {
  const now = Date.now()
  if (docker) return docker
  if (now - lastAttempt < RETRY_INTERVAL) return null
  lastAttempt = now

  const socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock'
  try {
    docker = new Docker({ socketPath, timeout: 5000 })
    return docker
  } catch {
    docker = null
    return null
  }
}

async function getContainers() {
  const d = getDocker()
  if (!d) return []

  try {
    const containers = await d.listContainers({ all: true })

    const results = []
    for (const c of containers) {
      let stats = { cpu_percent: 0, memory_usage: 0, memory_limit: 0, network_rx: 0, network_tx: 0 }
      if (c.State === 'running') {
        try {
          const stream = await Promise.race([
            d.getContainer(c.Id).stats({ stream: false }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('stats timeout')), 3000))
          ])
          if (stream?.cpu_stats) {
            const cpuDelta = stream.cpu_stats.cpu_usage.total_usage - (stream.precpu_stats?.cpu_usage?.total_usage || 0)
            const systemDelta = stream.cpu_stats.system_cpu_usage - (stream.precpu_stats?.system_cpu_usage || 0)
            const cpuCount = stream.cpu_stats.online_cpus || 1
            stats.cpu_percent = systemDelta > 0 ? Math.round((cpuDelta / systemDelta) * cpuCount * 10000) / 100 : 0

            const memStats = stream.memory_stats
            stats.memory_usage = memStats.usage || 0
            stats.memory_limit = memStats.limit || 0

            const networks = stream.networks || {}
            for (const net in networks) {
              stats.network_rx += networks[net].rx_bytes || 0
              stats.network_tx += networks[net].tx_bytes || 0
            }
          }
        } catch {}
      }

      const name = c.Names[0]?.replace(/^\//, '') || 'unknown'
      const image = c.Image || 'unknown'
      const ports = (c.Ports || []).map(p => `${p.PrivatePort}:${p.PublicPort || '?'}/${p.Type}`).join(', ')
      const started = c.State === 'running' ? c.StartedAt : null
      const uptimeSec = started ? Math.floor((Date.now() - new Date(started).getTime()) / 1000) : 0

      results.push({
        id: c.Id.slice(0, 12),
        name,
        image,
        status: c.State === 'running' ? 'running' : c.State === 'exited' ? 'stopped' : c.State,
        state: c.State,
        cpu: stats.cpu_percent,
        memory: Math.round(stats.memory_usage / 1024 / 1024),
        maxMemory: Math.round(stats.memory_limit / 1024 / 1024),
        networkRx: stats.network_rx,
        networkTx: stats.network_tx,
        ports,
        uptime: uptimeSec,
        createdAt: c.Created,
      })
    }
    return results
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED' || err.code === 'EACCES') {
      docker = null
      lastAttempt = 0
    }
    return []
  }
}

async function getDockerInfo() {
  const d = getDocker()
  if (!d) return { available: false }
  try {
    const info = await d.info()
    return {
      available: true,
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      images: info.Images,
      serverVersion: info.ServerVersion,
      driver: info.Driver,
    }
  } catch {
    docker = null
    return { available: false }
  }
}

module.exports = { getContainers, getDockerInfo }
