// TODO: remove

import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import { requireFields, precheck } from 'utils/validation';

import collectionRoutes from './collection';
import * as controller from './controller';

import Article, { queryUnpublished } from '../article.model';
import ArticleCollection from '../collection/model';
import LocalizedArticle from '../localized/model';

const router = Router();

router.use('/collections', collectionRoutes);

router.get('/', controller.getAll);
router.post(
  '/',
  requireAuth,
  verifyPermission('canCreateArticle'),
  requireFields('type', 'images'),
  precheck.createArticle,
  controller.create
);
// slugOrId parameter below either contains ID of an Article or a slug of any Article Localization.
router.get('/:slugOrId', controller.getOne);
router.put(
  '/:slugOrId',
  requireAuth,
  verifyPermission('canCreateArticle'),
  precheck.updateArticle,
  controller.update
);
router.delete('/:slugOrId', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { Article, ArticleCollection, LocalizedArticle, queryUnpublished };
export default router;