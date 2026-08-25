# Server Dashboard

Real-time server monitoring dashboard with live stats, service health checks, Docker container monitoring, and alerting.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real-time monitoring** — CPU, memory, disk, network via WebSocket
- **Service health checks** — HTTP/TCP checks with uptime tracking and latency history
- **Docker integration** — Live container stats, auto-discovery
- **SQLite persistence** — Uptime history, alert log, stats retention
- **JWT authentication** — Secure login with brute force protection
- **Rate limiting** — API and login rate limits
- **Alerting** — Discord, Telegram, generic webhook notifications
- **Dark/Light theme** — System preference detection + manual toggle
- **PWA support** — Installable on mobile and desktop
- **Command palette** — ⌘K keyboard navigation
- **Responsive** — Works on phones, tablets, and desktops

## Quick Start

### Docker (recommended)

```bash
git clone <repo-url> && cd server-dashboard
cp .env.example .env
# Edit .env with your secrets
docker compose up -d
```

Dashboard at `http://localhost:4321`. Default password: `admin`

### Manual

```bash
git clone <repo-url> && cd server-dashboard
cp .env.example .env
npm install
npm run build
npm start
```

### Development

```bash
npm install
npm run dev      # Frontend on :5173
npm run server   # Backend on :4321
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4321` | Server port |
| `JWT_SECRET` | (required) | Secret for JWT tokens |
| `ADMIN_PASSWORD` | `admin` | Login password |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket path |
| `CHECK_INTERVAL` | `5000` | Stats collection interval (ms) |
| `HEALTH_CHECK_TIMEOUT` | `5000` | Service check timeout (ms) |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `DISCORD_WEBHOOK` | — | Discord alert webhook |
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token |
| `TELEGRAM_CHAT_ID` | — | Telegram chat ID |
| `WEBHOOK_URL` | — | Generic webhook URL |

### Service Configuration

Add/remove services via the dashboard UI (sidebar → Manage Services) or edit `dashboard.config.json`:

```json
{
  "services": [
    { "id": "nginx", "name": "Nginx", "icon": "🌐", "type": "Web Server", "protocol": "http", "url": "http://localhost:80", "timeout": 5000 },
    { "id": "postgres", "name": "PostgreSQL", "icon": "🐘", "type": "Database", "protocol": "tcp", "url": "localhost:5432", "timeout": 3000 }
  ]
}
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | No | Health check |
| `/api/login` | POST | No | Login, returns JWT |
| `/api/stats` | GET | Yes | Current system stats |
| `/api/system` | GET | Yes | System information |
| `/api/services` | GET | Yes | Service health status |
| `/api/services/config` | GET | Yes | Configured services list |
| `/api/services` | POST | Yes | Add a service |
| `/api/services/:id` | PUT | Yes | Update a service |
| `/api/services/:id` | DELETE | Yes | Remove a service |
| `/api/docker` | GET | Yes | Docker containers |
| `/api/alerts` | GET | Yes | Recent alerts |
| `/api/uptime/:id` | GET | Yes | Service uptime history |

## Production Deployment

### PM2

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

### Docker Compose with monitoring stack

```yaml
# Add to docker-compose.yml for full stack:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
```

## Architecture

```
server/
  index.cjs        — Express + Socket.IO server
  stats.cjs        — System stats collector (CPU/RAM/disk/net/temp)
  docker.cjs       — Docker API integration
  healthcheck.cjs  — HTTP/TCP service health checks
  db.cjs           — SQLite database (auto-migrates)
  auth.cjs         — JWT auth + input sanitization
  alerts.cjs       — Webhook alerting (Discord/Telegram)
  config.cjs       — Dashboard config loader/saver
  ratelimit.cjs    — Rate limiting + brute force protection

src/
  App.jsx              — Main app with routing + code splitting
  hooks/useSocket.js   — WebSocket client for real-time data
  hooks/useKeyboard.js — Global keyboard shortcuts
  contexts/            — Theme, Toast providers
  components/          — All UI components (lazy-loaded)
```

## License

MIT
