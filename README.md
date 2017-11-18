# babajka-backend
[![Build Status](https://travis-ci.org/babajka/babajka-backend.svg?branch=master)](https://travis-ci.org/babajka/babajka-backend)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/27a0eb2d7da645b983b464238ca7248e)](https://www.codacy.com/app/babajka/babajka-backend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=babajka/babajka-backend&amp;utm_campaign=Badge_Grade)
[![Dependency Status](https://www.versioneye.com/user/projects/5958fad5368b0800734a43f0/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/5958fad5368b0800734a43f0)
[![Coverage Status](https://coveralls.io/repos/github/babajka/babajka-backend/badge.svg?branch=master)](https://coveralls.io/github/babajka/babajka-backend?branch=master)

Express &amp; Node.js app

We use [`airbnb/base`](https://github.com/airbnb/javascript) style guide

## scripts

* `npm start` runs dev server with watcher and reloading.

* `npm run start-prod` runs prod server locally. The same with `npm start` with the difference of building and running on the same machine.

* `npm run build` builds prod server into `build/` without running it.

* `npm run init-db` to create database and insert initial test data

* `npm run lint` checks the code style.

* `npm run test` to test and check coverage

* `npm run mocha` to test without coveralls.

## api

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/e78e33dafe7cff921407#?env%5Bbabajka%5D=W3siZW5hYmxlZCI6dHJ1ZSwia2V5IjoiRE9NQUlOIiwidmFsdWUiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJ0eXBlIjoidGV4dCJ9LHsiZW5hYmxlZCI6dHJ1ZSwia2V5IjoiQVBJX1VSTCIsInZhbHVlIjoiL2FwaSIsInR5cGUiOiJ0ZXh0In1d)

for testing `api` use [`Postman`](https://www.getpostman.com/)
latest collections and environments configs you can find in [`postman/`](https://github.com/babajka/babajka-backend/tree/master/postman) folder

> please update postman collections links and `.json` files after your changes
