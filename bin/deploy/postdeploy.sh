#!/usr/bin bash
set -e

MODE=$1

DEPLOYMENTS_PATH="/home/wir-$MODE/deployed"

rm -rf "${DEPLOYMENTS_PATH}/backend"
mv "${DEPLOYMENTS_PATH}/swap-backend/babajka-backend" "${DEPLOYMENTS_PATH}/backend"

cd "${DEPLOYMENTS_PATH}/backend"

if [ $MODE == "dev" ]; then
  JOB="backend-staging"
elif [ $MODE == "prod" ]; then
  JOB="backend-production"
else
  exit 1
fi

# In order for the command below to work properly make sure that lines
# case $- in
#     *i*) ;;
#       *) return;;
# esac
# in ~/.bashrc file on remote machine are commented out.
#
# Short explanation is: pm2 is not using interactive ssh.
pm2 restart pm2-config.json --only=$JOB
