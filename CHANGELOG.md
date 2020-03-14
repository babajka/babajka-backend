## [2.0.1](https://github.com/babajka/babajka-backend/compare/v2.0.0...v2.0.1) (2020-03-14)

### Bug Fixes

- **fibery:** fix preview collection article crash [[#73](https://github.com/babajka/babajka-backend/issues/73)](<[11c5aa1](https://github.com/babajka/babajka-backend/commit/11c5aa1)>)
- **specials:** add get today diary api [[#73](https://github.com/babajka/babajka-backend/issues/73)](<[e2c1c5f](https://github.com/babajka/babajka-backend/commit/e2c1c5f)>)

# [2.0.0](https://github.com/babajka/babajka-backend/compare/v1.0.1...v2.0.0) (2020-01-28)

### Bug Fixes

- minor fixes around the code ([6ba56b1](https://github.com/babajka/babajka-backend/commit/6ba56b1))
- **article:** add `articleIndex`, refactor article serialization [[#55](https://github.com/babajka/babajka-backend/issues/55)](<[0809715](https://github.com/babajka/babajka-backend/commit/0809715)>)
- **article:** add all articles into collection ([9684ac2](https://github.com/babajka/babajka-backend/commit/9684ac2))
- **article:** fix collection order [[#70](https://github.com/babajka/babajka-backend/issues/70)](<[cb497fc](https://github.com/babajka/babajka-backend/commit/cb497fc)>)
- **article:** refactor articles pagination with skip/take params ([d47386a](https://github.com/babajka/babajka-backend/commit/d47386a))
- **articles:** add rss feed [[#68](https://github.com/babajka/babajka-backend/issues/68)](<[b0e48f1](https://github.com/babajka/babajka-backend/commit/b0e48f1)>)
- **db:** db updates and an upgrade to mongoose@5 ([5b52751](https://github.com/babajka/babajka-backend/commit/5b52751))
- **db:** fix mongoose unique indexes, add tests [[#56](https://github.com/babajka/babajka-backend/issues/56)](<[0671adc](https://github.com/babajka/babajka-backend/commit/0671adc)>)
- **db:** set-password and grant-permissions scripts updated ([efb58b4](https://github.com/babajka/babajka-backend/commit/efb58b4))
- **diary:** add getBySlug api [[#66](https://github.com/babajka/babajka-backend/issues/66)](<[d8025a2](https://github.com/babajka/babajka-backend/commit/d8025a2)>)
- **fibery:** topic slug for fibery frontend preview ([247c868](https://github.com/babajka/babajka-backend/commit/247c868))
- **postman:** a vast update for postman calls ([c835afc](https://github.com/babajka/babajka-backend/commit/c835afc))
- **specials:** always return diary [[#62](https://github.com/babajka/babajka-backend/issues/62)](<[018dc68](https://github.com/babajka/babajka-backend/commit/018dc68)>)
- **tests:** all after(dropData) occurrences are replaced with before() ([0f40ac3](https://github.com/babajka/babajka-backend/commit/0f40ac3))
- **tests:** preferring [@babajka](https://github.com/babajka).io emails over [@wir](https://github.com/wir).by in testing ([b0cc3db](https://github.com/babajka/babajka-backend/commit/b0cc3db))
- **tools:** add GH deployments status report [[#61](https://github.com/babajka/babajka-backend/issues/61)](<[e3ddc99](https://github.com/babajka/babajka-backend/commit/e3ddc99)>)
- **tools:** replace `babel` build with `esm` & `module-alias` [[#38](https://github.com/babajka/babajka-backend/issues/38)](<[71371bf](https://github.com/babajka/babajka-backend/commit/71371bf)>)
- **topics-tags:** add get all articles by topic api [[#52](https://github.com/babajka/babajka-backend/issues/52)](<[e62d158](https://github.com/babajka/babajka-backend/commit/e62d158)>)
- **topics-tags:** some extra testing for tags/authors ([727a1e8](https://github.com/babajka/babajka-backend/commit/727a1e8))

### Features

- **article:** color and textColorTheme are added to the Article model ([e18559b](https://github.com/babajka/babajka-backend/commit/e18559b))
- **article:** create article from fibery import [[#55](https://github.com/babajka/babajka-backend/issues/55)](<[a60239d](https://github.com/babajka/babajka-backend/commit/a60239d)>)
- **article:** images are refactored ([394b349](https://github.com/babajka/babajka-backend/commit/394b349))
- **article:** localized keywords for Articles ([65d6a04](https://github.com/babajka/babajka-backend/commit/65d6a04))
- **config:** printing backend version on / page to simplify autoreploy ([27c1540](https://github.com/babajka/babajka-backend/commit/27c1540))
- **core:** ArticleBrand model is fully removed ([d17465d](https://github.com/babajka/babajka-backend/commit/d17465d))
- **core:** objectMetadata support for localized article model ([5a2caf5](https://github.com/babajka/babajka-backend/commit/5a2caf5))
- **core:** objectMetadata to keep track of object updates ([2ae3295](https://github.com/babajka/babajka-backend/commit/2ae3295))
- **core:** support for Authors-as-Users is fully removed ([49e66ad](https://github.com/babajka/babajka-backend/commit/49e66ad))
- **fibery:** fetch audio & serve as static [[#68](https://github.com/babajka/babajka-backend/issues/68)](<[c5dbb55](https://github.com/babajka/babajka-backend/commit/c5dbb55)>)
- **files:** add image processing (resize + progressive) [[#61](https://github.com/babajka/babajka-backend/issues/61)](<[5a711aa](https://github.com/babajka/babajka-backend/commit/5a711aa)>)
- **mail:** all Ira's changes from [#46](https://github.com/babajka/babajka-backend/issues/46) ([cc20b80](https://github.com/babajka/babajka-backend/commit/cc20b80))
- **rss:** add podcasts feed generation [[#68](https://github.com/babajka/babajka-backend/issues/68)](<[4c9f3db](https://github.com/babajka/babajka-backend/commit/4c9f3db)>)
- **specials:** add diaries fibery import [[#58](https://github.com/babajka/babajka-backend/issues/58)](<[867679c](https://github.com/babajka/babajka-backend/commit/867679c)>)
- **storage:** main page state [[#44](https://github.com/babajka/babajka-backend/issues/44)](<[0d5ad0a](https://github.com/babajka/babajka-backend/commit/0d5ad0a)>)
- **tools:** a script to init db with golden data from Google Drive ([54dcbf2](https://github.com/babajka/babajka-backend/commit/54dcbf2))
- **tools:** add cloudinary integration [[#47](https://github.com/babajka/babajka-backend/issues/47)](<[c61707f](https://github.com/babajka/babajka-backend/commit/c61707f)>)
- **tools:** auto deployment of develop branch using Travis ([a2d19a3](https://github.com/babajka/babajka-backend/commit/a2d19a3))
- **tools:** covering full year with diaries ([9beee76](https://github.com/babajka/babajka-backend/commit/9beee76))
- **tools:** deploying to prod from local ([33867dd](https://github.com/babajka/babajka-backend/commit/33867dd))
- **tools:** travis prod deployments ([af1c869](https://github.com/babajka/babajka-backend/commit/af1c869))
- **topics-tags:** authors as tags w/ validation ([0937f7a](https://github.com/babajka/babajka-backend/commit/0937f7a))
- **topics-tags:** brands as tags w/ validation ([eaa3ed1](https://github.com/babajka/babajka-backend/commit/eaa3ed1))
- **topics-tags:** init db script for tags; postman; populate improved ([ca94094](https://github.com/babajka/babajka-backend/commit/ca94094))
- **topics-tags:** script for fetching tags from the spreadsheet ([187eace](https://github.com/babajka/babajka-backend/commit/187eace))
- **topics-tags:** some tests for brands as tags ([2ab2044](https://github.com/babajka/babajka-backend/commit/2ab2044))
- **topics-tags:** tags api introduced ([dad3c8a](https://github.com/babajka/babajka-backend/commit/dad3c8a))
- **topics-tags:** tags support in main page state ([c8e9422](https://github.com/babajka/babajka-backend/commit/c8e9422))
- **topics-tags:** topics are introduced and included into main page ([c38fae0](https://github.com/babajka/babajka-backend/commit/c38fae0))

## [1.0.1](https://github.com/babajka/babajka-backend/compare/v1.0.0...v1.0.1) (2018-10-14)

### Bug Fixes

- **tools:** fix semantic package.json version update ([0ce254c](https://github.com/babajka/babajka-backend/commit/0ce254c))

# 1.0.0 (2018-10-13)

### Major Update

- babajka@v1.0 release 🎉🎉🎉

### Bug Fixes

- **articles:** change model for storing draft-js state ([490bde5](https://github.com/babajka/babajka-backend/commit/490bde5))
- **articles:** filter articles without locales ([4090c56](https://github.com/babajka/babajka-backend/commit/4090c56))
- **localized-article:** add validation for slug duplication ([bc56c87](https://github.com/babajka/babajka-backend/commit/bc56c87))
- **tools:** add commitlint ([092c654](https://github.com/babajka/babajka-backend/commit/092c654))
- **tools:** add semantic release, install babel@7 ([32814b0](https://github.com/babajka/babajka-backend/commit/32814b0))

---

@UladBohdan @Drapegnik
