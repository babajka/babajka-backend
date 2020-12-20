#!/usr/bin/env bash
set -e

cd "/home/wir-$1/deployed/swap-backend/babajka-backend"

npm ci # || true # HACK for submodules outside of git repository.
# patch-package