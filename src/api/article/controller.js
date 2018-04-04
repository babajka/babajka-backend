import difference from 'lodash/difference';
import omit from 'lodash/omit';

import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';

import { User, checkPermissions } from 'api/user';
import Article, { serializeArticle, checkIsPublished, POPULATE_OPTIONS } from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

export const getAll = ({ query, user }, res, next) => {
  const page = parseInt(query.page) || 0; // eslint-disable-line radix
  const pageSize = parseInt(query.pageSize) || 10; // eslint-disable-line radix
  const skip = page * pageSize;
  let data;
  const articlesQuery = { active: true };

  if (!checkPermissions(user, ['canManageArticles'])) {
    articlesQuery.publishAt = {
      $lt: Date.now(),
    };
  }

  return Article.find(articlesQuery)
    .populate('author', POPULATE_OPTIONS.author)
    .populate('brand', POPULATE_OPTIONS.brand)
    .populate('collectionId', POPULATE_OPTIONS.collection)
    .populate('locales', POPULATE_OPTIONS.locales)
    .sort({ publishAt: 'desc' })
    .skip(skip)
    .limit(pageSize)
    .then(articles => articles.map(serializeArticle))
    .then(articles => {
      data = articles;
      return Article.count();
    })
    .then(count => ({
      data,
      next: count > skip + pageSize && {
        page: page + 1,
        pageSize,
      },
    }))
    .then(sendJson(res))
    .catch(next);
};

const retrieveArticleId = slugOrId =>
  LocalizedArticle.findOne({ slug: slugOrId, active: true })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound);

export const getOne = ({ params: { slugOrId }, user }, res, next) =>
  retrieveArticleId(slugOrId)
    .then(articleId =>
      Article.findOne({ _id: articleId, active: true })
        .populate('author', POPULATE_OPTIONS.author)
        .populate('brand', POPULATE_OPTIONS.brand)
        .populate('collectionId', POPULATE_OPTIONS.collection)
        .populate('locales', POPULATE_OPTIONS.locales)
    )
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const create = ({ body }, res, next) =>
  // TODO(uladbohdan): to deprecate body.brand.
  ArticleBrand.findOne({ slug: body.brand || body.brandSlug })
    .then(obj => checkIsFound(obj, 400)) // Brand is required.
    .then(({ _id: brandId }) =>
      ArticleCollection.findOne({ slug: body.collectionSlug })
        .then(collection => collection && collection._id) // Collection is not required.
        .then(collectionId =>
          User.findOne({ email: body.authorEmail, role: 'author' })
            .then(author => author && author._id) // Author is not required.
            .then(authorId =>
              Article({
                ...omit(body, ['locales']),
                author: authorId,
                brand: brandId,
                collectionId,
              })
                .save()
                .then(async article => {
                  // Processing with localizations (Bundled API).
                  if (body.locales) {
                    await Promise.all(
                      Object.values(body.locales).map(localization =>
                        LocalizedArticle({
                          ...localization,
                          articleId: article._id,
                        })
                          .save()
                          .then(({ _id: locId }) => article.locales.push(locId))
                          .catch(next)
                      )
                    );
                  }
                  return article;
                })
                .then(article => article.save())
                .then(({ _id: articleId }) =>
                  Article.findOne({ _id: articleId })
                    .populate('author', POPULATE_OPTIONS.author)
                    .populate('brand', POPULATE_OPTIONS.brand)
                    .populate('collectionId', POPULATE_OPTIONS.collection)
                    .populate('locales', POPULATE_OPTIONS.locales)
                    .then(serializeArticle)
                    .then(sendJson(res))
                    .catch(next)
                )
                .catch(next)
            )
            .catch(next)
        )
        .catch(next)
    )
    .catch(next);

export const update = ({ params: { slugOrId }, body }, res, next) =>
  retrieveArticleId(slugOrId)
    .then(articleId =>
      ArticleBrand.findOne({ slug: body.brandSlug })
        .then(newBrand =>
          ArticleCollection.findOne({ slug: body.collectionSlug })
            .then(newCollection =>
              User.findOne({ email: body.authorEmail, role: 'author' })
                .then(newAuthor => {
                  const defaultFields = omit(body, [
                    'author',
                    'authorEmail',
                    'brand',
                    'brandSlug',
                    'collectionSlug',
                    'locales',
                  ]);
                  // TODO(uladbohdan): to refactor that, i.e. with pickBy / omitBy.
                  if (newBrand) {
                    defaultFields.brand = newBrand._id;
                  }
                  defaultFields.collectionId = newCollection && newCollection._id;
                  defaultFields.author = newAuthor && newAuthor._id;
                  return defaultFields;
                })
                .then(updateFields =>
                  Article.findOneAndUpdate({ _id: articleId }, updateFields, { new: true })
                    .then(async article => {
                      // Here Article is properly updated. Proceeding with locales.
                      let articleOldLocales = [];
                      if (body.locales) {
                        articleOldLocales = article.locales.slice(); // Copying.
                        article.locales.splice(0, article.locales.length); // Clearing with no reassignment.
                        await Promise.all(
                          Object.keys(body.locales).map(updLoc =>
                            LocalizedArticle.findOneAndUpdate(
                              {
                                locale: updLoc,
                                articleId,
                              },
                              body.locales[updLoc],
                              { new: true }
                            )
                              .then(async updatedLocalization => {
                                if (!updatedLocalization) {
                                  // Was not found + updated. Must be created. I assume.
                                  const newLocalization = await LocalizedArticle({
                                    ...body.locales[updLoc],
                                    articleId,
                                  }).save();
                                  return newLocalization._id;
                                }
                                return updatedLocalization._id;
                              })
                              .then(localeId => article.locales.push(localeId))
                              .catch(next)
                          )
                        );
                      }
                      return { article, articleOldLocales };
                    })
                    .then(({ article, articleOldLocales }) =>
                      article.save().then(async () => {
                        // Here I want to remove unnecessary locales.
                        // All locales which are in articleOldLocales and are not in article.locales
                        // must be removed.
                        await Promise.all(
                          difference(
                            articleOldLocales.map(l => l.toString()),
                            article.locales.map(l => l.toString())
                          ).map(oldLocaleId =>
                            LocalizedArticle.findOneAndUpdate(
                              { _id: oldLocaleId },
                              { active: false },
                              { new: true }
                            ).catch(next)
                          )
                        );
                        return article;
                      })
                    )
                    .then(() =>
                      Article.findOne({ _id: articleId })
                        .populate('author', POPULATE_OPTIONS.author)
                        .populate('brand', POPULATE_OPTIONS.brand)
                        .populate('collectionId', POPULATE_OPTIONS.collection)
                        .populate('locales', POPULATE_OPTIONS.locales)
                        .then(serializeArticle)
                        .then(sendJson(res))
                        .catch(next)
                    )
                    .catch(next)
                )
                .catch(next)
            )
            .catch(next)
        )
        .catch(next)
    )
    .catch(next);

export const remove = ({ params: { slugOrId } }, res, next) =>
  retrieveArticleId(slugOrId)
    .then(articleId => Article.update({ _id: articleId }, { active: false }))
    .then(() => res.sendStatus(200))
    .catch(next);
