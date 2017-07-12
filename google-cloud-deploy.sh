#!/bin/bash

# The bash script compiles the server and deploys it to Google Cloud.
# Require gcloud util to be installed on your machine, check out https://cloud.google.com/sdk/gcloud/
# Deploying to Google Cloud may require additional permissions.

# Compiling JS-code using babel.
npm run build

# Deploying the app to Google Cloud.
cd build
gcloud app deploy
