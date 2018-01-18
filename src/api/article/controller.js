import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import { checkPermissions } from 'api/user';
import Article, { serializeArticle, checkIsPublished } from './article.model';
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
    .populate('brand')
    .populate('collectionId', '-_id name slug')
    .populate('locales', '-_id -__v')
    .sort({ publishAt: 'desc' })
    .skip(skip)
    .limit(pageSize)
    .then(articles => articles)
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

export const getOne = ({ params: { slug }, user }, res, next) =>
  LocalizedArticle.findOne({ slug })
    .then(checkIsFound)
    .then(({ articleId }) =>
      Article.findOne({ _id: articleId, active: true })
        .populate('brand')
        .populate('collectionId', '-_id name slug')
        .populate('locales', '-_id -__v')
    )
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const create = async ({ body }, res, next) => {
  try {
    const articleBrandQuery = ArticleBrand.findOne({ name: body.brand });
    const articleBrand = (await articleBrandQuery.exec()) || new ArticleBrand({ name: body.brand });
    await articleBrand.save();

    const articleCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();

    const articleBody = {
      ...body,
      brand: articleBrand._id,
      collectionId: articleCollection && articleCollection._id,
    };

    let data;
    let code;
    try {
      const article = Article(articleBody);
      await article.save();
      data = serializeArticle(await article.populate('brand').execPopulate());
      if (articleCollection) {
        articleCollection.articles.push(article._id);
        await articleCollection.save();
      }
    } catch (err) {
      code = 400;
      data = err;
    }
    sendJson(res, code)(data);
  } catch (err) {
    next(err);
  }
};

export const update = ({ params: { slug }, body }, res, next) =>
  LocalizedArticle.findOne({ slug })
    .then(checkIsFound)
    .then(({ articleId }) =>
      Article.findOneAndUpdate({ _id: articleId }, body, { new: true })
        .populate('brand')
        .populate('collectionId', '-_id name slug')
        .populate('locales', '-_id -__v')
    )
    .then(checkIsFound)
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const remove = ({ params: { slug } }, res, next) =>
  LocalizedArticle.findOne({ slug })
    .then(checkIsFound)
    .then(({ articleId }) => Article.update({ _id: articleId }, { active: false }))
    .then(() => res.sendStatus(200))
    .catch(next);
