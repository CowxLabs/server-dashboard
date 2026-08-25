FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache tini
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY .env.example ./.env.example

RUN addgroup -g 1001 -S dashboard && \
    adduser -S dashboard -u 1001 -G dashboard && \
    adduser dashboard docker 2>/dev/null || true
RUN mkdir -p /app/data && chown -R dashboard:dashboard /app
RUN chmod 644 /var/run/docker.sock 2>/dev/null || true

USER dashboard

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost:4321/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server/index.cjs"]
