const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const TOKEN_EXPIRY = '7d'
const isProduction = process.env.NODE_ENV === 'production'

function generateToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a || '')
  const bufB = Buffer.from(b || '')
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length))
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid authorization header' })

  const token = authHeader.slice(7)
  if (!token || token.length > 2048) return res.status(401).json({ error: 'Invalid token' })

  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' })

  req.user = decoded
  next()
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next()

  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (decoded) req.user = decoded
  next()
}

function loginHandler(req, res) {
  const { password } = req.body
  if (!password || !timingSafeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  const token = generateToken()
  res.json({ token, expiresIn: TOKEN_EXPIRY })
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[<>"'`;]/g, '').trim().slice(0, 200)
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clean = {}
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') clean[key] = sanitizeInput(val)
    else if (typeof val === 'number' && isFinite(val)) clean[key] = val
    else if (typeof val === 'boolean') clean[key] = val
    else if (typeof val === 'object' && val !== null) clean[key] = sanitizeObject(val)
  }
  return clean
}

function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

module.exports = { authMiddleware, optionalAuth, loginHandler, generateToken, verifyToken, sanitizeInput, sanitizeObject, sanitizeMiddleware }
