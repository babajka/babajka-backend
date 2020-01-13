#!/usr/bin/env bash
set -e

MODE=$1
if [ $MODE != "dev" ] && [ $MODE != "prod" ]
then
  echo '[FAIL] Mode (dev or prod) must be provided.'
  exit 1
fi

# load env
export $(cat .env | xargs)
sh bin/deploy/before-deploy.sh $MODE

BACKEND_REMOTE_SWAP_PATH="/home/wir-$MODE/deployed/swap-backend/babajka-backend/"
HOST="wir-$MODE@$MODE.wir.by"

ssh $HOST "mkdir -p \"${BACKEND_REMOTE_SWAP_PATH}\""
rsync -r --delete-after --exclude=.git --exclude=node_modules . \
  $HOST:"${BACKEND_REMOTE_SWAP_PATH}"
echo '[OK] Backend pushed to server'

ssh $HOST 'bash -s' < bin/deploy/install-deps.sh $MODE
echo '[OK] Dependencies are installed'

ssh $HOST 'bash -s' < bin/deploy/postdeploy.sh $MODE
echo '[OK] Deployed'

sh bin/deploy/after-deploy.sh $MODE
