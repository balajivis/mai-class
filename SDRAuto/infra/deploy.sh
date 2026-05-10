#!/usr/bin/env bash
set -euo pipefail

VM_IP="20.42.22.45"
VM_USER="azureuser"
APP_DIR="/opt/sdrauto"
SSH="ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP}"

echo "==> Syncing code to VM..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  --exclude .env \
  -e "ssh -o StrictHostKeyChecking=no" \
  . "${VM_USER}@${VM_IP}:${APP_DIR}/"

echo "==> Installing dependencies and building..."
$SSH "cd ${APP_DIR} && npm ci --production=false && npm run build"

echo "==> Running Prisma migrations..."
$SSH "cd ${APP_DIR} && npx prisma generate && npx prisma db push"

echo "==> Restarting with PM2..."
$SSH "cd ${APP_DIR} && pm2 startOrRestart ecosystem.config.cjs --env production && pm2 save"

echo "==> Health check..."
sleep 3
$SSH "curl -sf http://localhost:3000/health || echo 'Health check failed — check logs with: pm2 logs sdrauto-api'"

echo "==> Done! App running at http://${VM_IP}"
