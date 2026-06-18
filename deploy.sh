#!/bin/bash
# Deploy Bagchee to VPS at www.bagchee.com
# Usage: ./deploy.sh          → deploy both API + UI
#        ./deploy.sh api       → deploy API only
#        ./deploy.sh ui        → deploy UI only

SERVER="root@84.21.171.24"
SSH_KEY="$HOME/.ssh/bagchee_vps"
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"
RSYNC="rsync -avz --delete -e 'ssh -i $SSH_KEY -o StrictHostKeyChecking=no'"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

deploy_api() {
  echo "→ Uploading API..."
  rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='*.log' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_ROOT/api/" "$SERVER:/opt/bagchee/api/"

  echo "→ Installing dependencies & restarting..."
  $SSH "$SERVER" "
    cd /opt/bagchee/api
    npm install --production --silent
    npx prisma db push --skip-generate 2>&1 | tail -2
    npx prisma generate --silent 2>/dev/null
    pm2 restart bagchee-api --update-env
    pm2 save
  "
  echo "✓ API deployed and restarted"
}

deploy_ui() {
  echo "→ Building React UI..."
  cd "$PROJECT_ROOT/ui"
  REACT_APP_API_URL=https://www.bagchee.com/api \
  REACT_APP_FRONTEND_URL=https://www.bagchee.com \
  REACT_APP_EXCHANGE_RATE_API_KEY=01b425d377751fbbed67dcdc \
  REACT_APP_ENCRYPTION_SECRET=metXFqhCDc39LVSNnwthDmdYQLGZZVx10rR8Qzybw7Au3C2lW/JqdunzKD9ieoQ+ \
  REACT_APP_RECAPTCHA_SITE_KEY="${REACT_APP_RECAPTCHA_SITE_KEY:-}" \
  npm run build || { echo "✗ Build FAILED — aborting deploy, server untouched"; exit 1; }

  echo "→ Uploading build to server..."
  # --exclude sitemap*.xml: the sitemap files in the web root are pre-generated on the
  # server by api/scripts/generateSitemaps.js (nightly cron) and are NOT in ui/build.
  # Without this exclude, --delete would wipe them on every UI deploy.
  rsync -avz --delete \
    --exclude='sitemap*.xml' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_ROOT/ui/build/" "$SERVER:/var/www/html/bagchee-react/"

  echo "✓ UI deployed"
  cd "$PROJECT_ROOT"
}

case "${1:-both}" in
  api)  deploy_api ;;
  ui)   deploy_ui ;;
  both) deploy_api && deploy_ui ;;
  *)    echo "Usage: ./deploy.sh [api|ui|both]" && exit 1 ;;
esac
