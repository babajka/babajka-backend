#!/usr/bin bash
set -e

DEPLOYMENTS_PATH="/home/wir-dev/deployed"

rm -rf "${DEPLOYMENTS_PATH}/backend"
mv "${DEPLOYMENTS_PATH}/swap-backend/babajka-backend" "${DEPLOYMENTS_PATH}/backend"

cd "${DEPLOYMENTS_PATH}/backend"

# In order for the command below to work properly make sure that lines
# case $- in
#     *i*) ;;
#       *) return;;
# esac
# in ~/.bashrc file on remote machine are commented out.
#
# Short explanation is: pm2 is not using interactive ssh.
pm2 restart pm2-config.json --only=backend-staging
