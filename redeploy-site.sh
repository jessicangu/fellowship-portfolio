#!/bin/bash

set -e

PROJECT_DIR="/root/fellowship-portfolio"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.docker"

echo "starting Docker portfolio redeployment..."

cd "$PROJECT_DIR"

echo "fetching the latest code from GitHub..."
git fetch origin
git reset --hard origin/main

echo "ensuring the legacy systemd service is stopped..."
systemctl stop myportfolio 2>/dev/null || true
systemctl disable myportfolio 2>/dev/null || true

echo "rebuilding and restarting Docker containers..."
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d --build --remove-orphans

echo "checking container status..."
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  ps

echo "redeployment completed successfully."
