# babajka-backend
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/27a0eb2d7da645b983b464238ca7248e)](https://www.codacy.com/app/babajka/babajka-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=babajka/babajka-backend&amp;utm_campaign=Badge_Grade)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Dependency Status](https://www.versioneye.com/user/projects/5958fad5368b0800734a43f0/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/5958fad5368b0800734a43f0)

Express &amp; Node.js app

## scripts

* `npm run start-dev` runs dev server with watcher and reloading.

* `npm run start` or `npm start` are for running on Google Cloud only. You won't success running it locally.

* `npm run start-prod` runs prod server locally. The same with `npm start` with the difference of building and running on the same machine.

* `npm run build` builds prod server into `build/` without running it.

* `npm run lint` checks the codestyle.

## deployment

Run `bash google-cloud-deploy.sh` to deploy the server to Google Cloud. May require additional permissions.
