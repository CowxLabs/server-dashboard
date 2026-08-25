import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = window.location.origin

export function useSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [containers, setContainers] = useState([])
  const [systemInfo, setSystemInfo] = useState({})

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token')
    if (!token) {
      setConnected(false)
      return
    }

    if (socketRef.current?.connected) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 50,
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('stats', setStats)
    socket.on('services', setServices)
    socket.on('containers', setContainers)
    socket.on('systemInfo', setSystemInfo)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [localStorage.getItem('dashboard_token')])

  const checkService = useCallback((serviceId) => {
    socketRef.current?.emit('checkService', serviceId)
  }, [])

  return { connected, stats, services, containers, systemInfo, checkService }
}
