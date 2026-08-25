import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = window.location.origin

export function useSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [reconnected, setReconnected] = useState(false)
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [containers, setContainers] = useState([])
  const [systemInfo, setSystemInfo] = useState({})
  const [alerts, setAlerts] = useState([])
  const wasConnected = useRef(false)
  const reconnectTimer = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token')
    if (!token) { setConnected(false); return }
    if (socketRef.current?.connected) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 50,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      if (wasConnected.current) {
        setReconnected(true)
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = setTimeout(() => setReconnected(false), 3000)
      }
      wasConnected.current = true
      setConnected(true)
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('stats', setStats)
    socket.on('services', setServices)
    socket.on('containers', setContainers)
    socket.on('systemInfo', setSystemInfo)
    socket.on('alerts', setAlerts)

    return () => {
      clearTimeout(reconnectTimer.current)
      socket.disconnect()
      socketRef.current = null
      wasConnected.current = false
    }
  }, [localStorage.getItem('dashboard_token')])

  const checkService = useCallback((serviceId) => {
    socketRef.current?.emit('checkService', serviceId)
  }, [])

  return { connected, reconnected, stats, services, containers, systemInfo, alerts, checkService }
}
