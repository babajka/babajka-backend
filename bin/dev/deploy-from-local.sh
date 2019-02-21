#!/usr/bin/env bash
set -e

BACKEND_REMOTE_SWAP_PATH="/home/wir-dev/deployed/swap-backend/babajka-backend/"
ssh wir-dev@dev.wir.by "mkdir -p \"${BACKEND_REMOTE_SWAP_PATH}\""
rsync -r --delete-after --exclude=.git --exclude=node_modules . \
  wir-dev@dev.wir.by:"${BACKEND_REMOTE_SWAP_PATH}"
echo '[OK] Backend pushed to server'

ssh wir-dev@dev.wir.by 'bash -s' < bin/dev/install-deps.sh
echo '[OK] Dependencies are installed'

ssh wir-dev@dev.wir.by 'bash -s' < bin/dev/postdeploy.sh
echo '[OK] Deployed'
