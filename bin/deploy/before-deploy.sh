#!/usr/bin/env bash
set -e

echo 'Create deployment status'
sha=$(git rev-parse HEAD)
npm run gds -- --token $GH_TOKEN -a create -e $1 -r $sha
npm run gds -- --token $GH_TOKEN -a in_progress -e $1 -r $sha
