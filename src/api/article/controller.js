import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';
import Article, { serializeArticle } from './article.model';

export const getAll = (req, res, next) => {
  const page = parseInt(req.query.page) || 0; // eslint-disable-line radix
  const pageSize = parseInt(req.query.pageSize) || 10; // eslint-disable-line radix
  const skip = page * pageSize;
  let data;

  return Article
    .find({})
    .populate('type')
    .skip(skip)
    .limit(pageSize)
    .then(articles => articles.map(serializeArticle))
    .then((articles) => {
      data = articles;
      return Article.count();
    })
    .then(count => ({
      data,
      next: (count > skip + pageSize) && {
        page: page + 1,
        pageSize,
      },
    }))
    .then(sendJson(res))
    .catch(next);
};

export const getOne = ({ params: { slug } }, res, next) => Article
  .findOne({ slug })
  .then(checkIsFound)
  .then(serializeArticle)
  .then(sendJson(res))
  .catch(next);

export const create = ({ body }, res, next) => Promise.resolve(new Article(body))
  .then(article => article.save())
  .then(
    article => ({ data: serializeArticle(article) }),
    err => ({ code: 400, data: err }))
  .then(({ data, code }) => sendJson(res, code)(data))
  .catch(next);

export const update = ({ params: { slug }, body }, res, next) => Article
  .findOneAndUpdate({ slug }, body, { new: true })
  .then(checkIsFound)
  .then(sendJson(res))
  .catch(next);

export const remove = async ({ params: { slug } }, res, next) => Article
  .findOneAndRemove({ slug })
  .then(checkIsFound)
  .then(() => res.sendStatus(200))
  .catch(next);
