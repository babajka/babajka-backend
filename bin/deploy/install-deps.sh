#!/usr/bin/env bash
set -e

cd "/home/wir-$1/deployed/swap-backend/babajka-backend"

npm i --production
