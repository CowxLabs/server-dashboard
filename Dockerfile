FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache tini python3 make g++ wget
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server ./server
RUN mkdir -p /app/data

USER root

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost:4321/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server/index.cjs"]
