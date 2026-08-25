const http = require('http')
const https = require('https')

const webhooks = {
  discord: process.env.DISCORD_WEBHOOK || null,
  telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? { token: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID } : null,
  generic: process.env.WEBHOOK_URL || null,
}

function sendDiscord(message, severity) {
  const url = webhooks.discord
  if (!url) return
  const colors = { critical: 0xf87171, warning: 0xfb923c, info: 0x6c8cff }
  const payload = JSON.stringify({
    embeds: [{
      title: 'Server Dashboard Alert',
      description: message,
      color: colors[severity] || 0x6c8cff,
      timestamp: new Date().toISOString(),
    }]
  })
  const client = url.startsWith('https') ? https : http
  const req = client.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  req.on('error', () => {})
  req.end(payload)
}

function sendTelegram(message) {
  const t = webhooks.telegram
  if (!t) return
  const text = encodeURIComponent(`\u{1F5A5}\uFE0F Server Dashboard\n${message}`)
  const url = `https://api.telegram.org/bot${t.token}/sendMessage?chat_id=${t.chatId}&text=${text}`
  https.get(url, () => {}).on('error', () => {})
}

function sendGenericWebhook(payload) {
  const url = webhooks.generic
  if (!url) return
  const data = JSON.stringify(payload)
  const client = url.startsWith('https') ? https : http
  const req = client.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  req.on('error', () => {})
  req.end(data)
}

function sendAlert(message, severity = 'info', service = null) {
  const fullMessage = service ? `[${service}] ${message}` : message
  if (severity === 'critical') {
    sendDiscord(fullMessage, severity)
    sendTelegram(fullMessage)
  }
  sendGenericWebhook({ severity, message: fullMessage, service, timestamp: new Date().toISOString() })
}

module.exports = { sendAlert }
