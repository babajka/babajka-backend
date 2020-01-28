#!/usr/bin/env bash
set -e

MODE=$1

if [ $MODE == "dev" ]; then
  URL="https://api.wir.by"
elif [ $MODE == "prod" ]; then
  URL="https://api-prod.wir.by"
else
  exit 1
fi

npm run gds -- --token $GH_TOKEN -a success -e $MODE -r $(git rev-parse HEAD) -l $URL
