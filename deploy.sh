#!/bin/bash
# Deploy both services to Railway
# Usage: ./deploy.sh          → deploy both
#        ./deploy.sh api       → deploy API only
#        ./deploy.sh ui        → deploy UI only

API_SERVICE="fc663c89-f3e3-4b63-944e-1ba12540bb22"
UI_SERVICE="259f1fd6-af2f-4e64-ba2c-9a9f9bd36d42"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

deploy_api() {
  echo "→ Deploying API..."
  railway service link "$API_SERVICE"
  railway up --service "$API_SERVICE" --detach
  echo "✓ API deploy triggered"
}

deploy_ui() {
  echo "→ Deploying UI..."
  railway service link "$UI_SERVICE"
  cd "$PROJECT_ROOT/ui"
  railway up --service "$UI_SERVICE" --detach
  cd "$PROJECT_ROOT"
  echo "✓ UI deploy triggered (React build takes ~3-4 min)"
}

case "${1:-both}" in
  api)  deploy_api ;;
  ui)   deploy_ui ;;
  both) deploy_api && deploy_ui ;;
  *)    echo "Usage: ./deploy.sh [api|ui|both]" && exit 1 ;;
esac

# Always reset link to UI service after deploying
railway service link "$UI_SERVICE"
echo "✓ Service link reset to UI"
