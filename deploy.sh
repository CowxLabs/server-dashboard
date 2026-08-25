#!/bin/bash
set -e

echo "========================================="
echo "  Server Dashboard - GCP VPS Deploy"
echo "========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[1/5] Installing Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed"
else
    echo "[1/5] Docker found: $(docker --version)"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[2/5] Installing Docker Compose plugin..."
    apt-get install -y -qq docker-compose-plugin
else
    echo "[2/5] Docker Compose found: $(docker compose version --short)"
fi

# Setup project
echo "[3/5] Setting up project..."
if [ ! -d ".git" ]; then
    echo "  Clone the repo first:"
    echo "    git clone https://github.com/CowxLabs/server-dashboard.git"
    echo "    cd server-dashboard"
    exit 1
fi

# Create .env if missing
if [ ! -f ".env" ]; then
    echo "[4/5] Creating .env from template..."
    cp .env.example .env
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    echo "  .env created with random JWT_SECRET"
    echo "  IMPORTANT: Edit .env to set ADMIN_PASSWORD"
else
    echo "[4/5] .env exists"
fi

# Build and start
echo "[5/5] Building and starting..."
docker compose up -d --build

echo ""
echo "========================================="
echo "  Server Dashboard is running!"
echo "========================================="
echo ""
echo "  URL:  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):4321"
echo "  Health: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):4321/health"
echo ""
echo "  Default password: $(grep ADMIN_PASSWORD .env | cut -d= -f2)"
echo ""
echo "  GCP Firewall: Allow TCP port 4321 in your VPC firewall rules"
echo "  Logs: docker compose logs -f"
echo ""
