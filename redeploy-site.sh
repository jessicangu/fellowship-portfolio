#!/bin/bash

set -e

PROJECT_DIR="/root/fellowship-portfolio"

echo "Starting Docker portfolio redeployment..."

cd "$PROJECT_DIR"

echo "Fetching the latest code from GitHub..."
git fetch origin
git reset --hard origin/main

echo "Stopping legacy systemd service if it is running..."
systemctl stop myportfolio 2>/dev/null || true
systemctl disable myportfolio 2>/dev/null || true

echo "Stopping existing Docker containers..."
docker compose \
  --env-file .env.docker \
  -f docker-compose.prod.yml \
  down

echo "Rebuilding and starting Docker containers..."
docker compose \
  --env-file .env.docker \
  -f docker-compose.prod.yml \
  up -d --build

echo "Checking container status..."
docker compose \
  --env-file .env.docker \
  -f docker-compose.prod.yml \
  ps

echo "Redeployment completed successfully."
