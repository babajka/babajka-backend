#!/usr/bin/env bash
set -e

npm run gds -- --token $GH_TOKEN -a success -e $1 -r $(git rev-parse HEAD) -l "http://$1.wir.by"
