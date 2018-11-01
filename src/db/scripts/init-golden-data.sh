set -e

# This script fully initializes db with golden data provided.
# An example of use:
#   npm run init-golden-data -- '${HOME}/secret-dev.json' '${GOOGLE_DRIVE}/Wir/golden-data/'

npm run init-db -- "$1" "$2"
npm run init-prod-diaries -- "$1"
