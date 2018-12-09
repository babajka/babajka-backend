#!/usr/bin/env bash
set -e

DEPLOYMENTS_PATH="/home/wir-dev/deployed"

rm -rf "${DEPLOYMENTS_PATH}/backend"
mv "${DEPLOYMENTS_PATH}/swap-backend/babajka-backend" "${DEPLOYMENTS_PATH}/backend"

cd "${DEPLOYMENTS_PATH}/backend"
pm2 start pm2-config.json --only=backend-staging
