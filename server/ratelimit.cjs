const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
})

const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many write requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
})

const failedLogins = new Map()

function checkBruteForce(ip) {
  const record = failedLogins.get(ip) || { count: 0, lastAttempt: 0 }
  const now = Date.now()
  if (now - record.lastAttempt > 30 * 60 * 1000) {
    record.count = 0
  }
  record.count++
  record.lastAttempt = now
  failedLogins.set(ip, record)
  return record.count >= 10
}

function resetBruteForce(ip) {
  failedLogins.delete(ip)
}

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const [ip, record] of failedLogins) {
    if (record.lastAttempt < cutoff) failedLogins.delete(ip)
  }
}, 5 * 60 * 1000)

module.exports = { loginLimiter, apiLimiter, writeLimiter, checkBruteForce, resetBruteForce }
