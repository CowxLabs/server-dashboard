const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'dashboard.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS uptime_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,
    status TEXT NOT NULL,
    response_ms INTEGER,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    service TEXT,
    source TEXT,
    acknowledged INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stats_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpu REAL,
    memory REAL,
    disk REAL,
    net_rx INTEGER,
    net_tx INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS container_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT NOT NULL,
    container_name TEXT NOT NULL,
    cpu REAL,
    memory INTEGER,
    network_rx INTEGER,
    network_tx INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_uptime_service ON uptime_history(service_id);
  CREATE INDEX IF NOT EXISTS idx_uptime_time ON uptime_history(checked_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(created_at);
  CREATE INDEX IF NOT EXISTS idx_stats_time ON stats_history(recorded_at);
  CREATE INDEX IF NOT EXISTS idx_container_stats_name ON container_stats(container_name);
  CREATE INDEX IF NOT EXISTS idx_container_stats_time ON container_stats(recorded_at);
`)

const CLEANUP_OLDER_THAN = '7 days'

function cleanupOldData() {
  try {
    const r1 = db.prepare(`DELETE FROM uptime_history WHERE checked_at < datetime('now', '-${CLEANUP_OLDER_THAN}')`).run()
    const r2 = db.prepare(`DELETE FROM stats_history WHERE recorded_at < datetime('now', '-${CLEANUP_OLDER_THAN}')`).run()
    const r3 = db.prepare(`DELETE FROM alerts WHERE acknowledged = 1 AND created_at < datetime('now', '-${CLEANUP_OLDER_THAN}')`).run()
    const total = r1.changes + r2.changes + r3.changes
    if (total > 0) console.log(`[DB] Cleaned up ${total} old records`)
  } catch (err) {
    console.error('[DB] Cleanup error:', err.message)
  }
}

setInterval(cleanupOldData, 6 * 60 * 60 * 1000)

module.exports = db
