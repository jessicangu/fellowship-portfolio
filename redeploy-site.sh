#!/bin/bash

set -e

PROJECT_DIR="/root/fellowship-portfolio"
VENV_DIR="$PROJECT_DIR/python3-virtualenv"
SERVICE_NAME="myportfolio"

echo "Starting portfolio redeployment..."

cd "$PROJECT_DIR"

echo "Fetching the latest code from GitHub..."
git fetch origin
git reset --hard origin/main

echo "Activating the Python virtual environment..."
source "$VENV_DIR/bin/activate"

echo "Installing Python dependencies..."
python -m pip install -r requirements.txt

echo "Restarting the portfolio systemd service..."
systemctl restart "$SERVICE_NAME"

echo "Checking service status..."
systemctl is-active --quiet "$SERVICE_NAME"

echo "Redeployment completed successfully."
