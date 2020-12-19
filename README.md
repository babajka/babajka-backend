# babajka-backend

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Coverage Status](https://coveralls.io/repos/github/babajka/babajka-backend/badge.svg?branch=master)](https://coveralls.io/github/babajka/babajka-backend?branch=master)
[![StackShare](https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](https://stackshare.io/wir-by/wir-by-backend)

Express &amp; Node.js app

We use [`airbnb/base`](https://github.com/airbnb/javascript) style guide

## scripts

- `nvm use` - set correct `node` version

- `npm start` runs dev server with watcher and reloading

- `npm run start-prod` runs prod server locally

- `npm run init-db` to create database and insert initial test data

- `npm run lint` to check code style with [`eslint`](http://eslint.org/),
  [`airbnb`](https://github.com/airbnb/javascript/tree/master/react) react style guide and
  [`prettier`](https://prettier.io)

- `npm run prettify` to just fix style with `prettier`

- `npm run test:with-coverage` to test and check coverage

- `npm run test` to test without coveralls

- `npm run deploy-dev-from-local` or `npm run deploy-prod-from-local` to deploy code to staging or production Wir

## development tips

### gm

> you should install [`gm`](https://github.com/aheckmann/gm) locally:

```bash
brew install graphicsmagick
```

### selective testing

usage:

`npm run test:subset -- /auth` - to only run auth tests

`npm run test:subset -- /api/storage` - to only run storage tests

`npm run test:subset -- /utils` - to only run utils tests

etc.

## rules [OUTDATED]

- we have autoversioning set up, in order to trigger new release one should follow the conventions:
  - `fix(<scope>): <subject>` - increases **patch** version: 1.0.0 -> 1.0.1
  - `feat(<scope>): <subject>` - increases **minor** version: 1.0.0 -> 1.1.0
  - `major(<scope>): <subject>` - increases **major** version: 1.0.0 -> 2.0.0

## submodules

- use `git submodule update --init`
