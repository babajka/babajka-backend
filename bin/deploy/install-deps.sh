#!/usr/bin/env bash
set -e

cd "/home/wir-$1/deployed/swap-backend/babajka-backend"

# npm install --build-from-source

npm ci

# https://github.com/kelektiv/node.bcrypt.js/issues/800 ???
# cd node_modules/bcrypt && node-pre-gyp install --fallback-to-build && cd ../..
